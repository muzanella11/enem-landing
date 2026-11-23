import { RedisService } from '@enem-landing/backend-redis';
import type {
  BackupStatus,
  TlsCertStatus,
  UptimeIncident,
  UptimeOverview,
  UptimeTargetStatus,
} from '@enem-landing/shared-types';
import { Injectable, Logger } from '@nestjs/common';
import { connect } from 'node:tls';
import { DbStatsService } from '../db/db-stats.service.js';
import { LogReaderClient } from '../logs/log-reader.client.js';
import { monitorEnvironment } from '../monitor.config.js';
import { MonitorStore } from '../store/monitor-store.js';
import {
  tlsHosts,
  type UptimeTarget,
  uptimeTargets,
} from './uptime-targets.js';

export const CHECK_TIMEOUT_MS = 10_000;
/** Down = this many failed checks in a row (also the alert rule's default). */
export const DOWN_AFTER = 3;
const DAY_MS = 86_400_000;
const SAMPLE_TTL_SECONDS = 8 * 86_400;

export interface CheckResult {
  ok: boolean;
  status: number | null;
  latencyMs: number | null;
  error: string | null;
}

interface TargetState {
  consecutiveFailures: number;
  lastStatus: number | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  lastCheckedAt: string | null;
  firstFailureAt: string | null;
  down: boolean;
}

const dayKey = (ms: number) =>
  new Date(ms).toISOString().slice(0, 10).replace(/-/g, '');

/** 2xx and 3xx are up (a redirect to the SSO sign-in is a healthy CMS). */
export const checkHttp = async (
  url: string,
  timeoutMs = CHECK_TIMEOUT_MS,
): Promise<CheckResult> => {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'enem-landing-monitor-uptime' },
    });
    await response.body?.cancel().catch(() => undefined);
    const latencyMs = Date.now() - started;
    const ok = response.status >= 200 && response.status < 400;
    return {
      ok,
      status: response.status,
      latencyMs,
      error: ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return {
      ok: false,
      status: null,
      latencyMs: null,
      error: timedOut
        ? `Timeout ${timeoutMs / 1000} s`
        : error instanceof Error
          ? error.cause instanceof Error
            ? error.cause.message
            : error.message
          : String(error),
    };
  }
};

/** Reads `valid_to` of the certificate a host serves on 443. */
export const checkTls = (
  host: string,
  timeoutMs = CHECK_TIMEOUT_MS,
): Promise<TlsCertStatus> =>
  new Promise((resolve) => {
    const checkedAt = new Date().toISOString();
    const socket = connect({
      host,
      port: 443,
      servername: host,
      timeout: timeoutMs,
      // Expired or mismatched certificates must still be read and reported.
      rejectUnauthorized: false,
    });
    const done = (status: Omit<TlsCertStatus, 'host' | 'checkedAt'>) => {
      socket.destroy();
      resolve({ host, checkedAt, ...status });
    };
    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate();
      if (!cert?.valid_to) {
        done({
          validTo: null,
          daysLeft: null,
          issuer: null,
          error: 'No certificate',
        });
        return;
      }
      const validTo = new Date(cert.valid_to);
      const issuer = cert.issuer as unknown as
        Record<string, string | string[]> | undefined;
      const org = issuer?.['O'] ?? issuer?.['CN'] ?? null;
      done({
        validTo: validTo.toISOString(),
        daysLeft: Math.floor((validTo.getTime() - Date.now()) / DAY_MS),
        issuer: Array.isArray(org) ? org.join(', ') : org,
        error: null,
      });
    });
    socket.once('timeout', () =>
      done({ validTo: null, daysLeft: null, issuer: null, error: 'Timeout' }),
    );
    socket.once('error', (error) =>
      done({
        validTo: null,
        daysLeft: null,
        issuer: null,
        error: error.message,
      }),
    );
  });

/**
 * Uptime of this environment's targets, checked every minute
 * by the scheduler. Samples (`minute,ok,latency;`) are appended to one
 * key per target per day, kept 8 days, for the 24 h/7 d uptime and the
 * latency chart. Incidents start at the first failure of a run of
 * `DOWN_AFTER` failures and are recorded when the target is back up.
 */
@Injectable()
export class UptimeService {
  private readonly logger = new Logger(UptimeService.name);
  private backupCache: { at: number; value: BackupStatus | null } | null = null;

  constructor(
    private readonly store: MonitorStore,
    private readonly redis: RedisService,
    private readonly db: DbStatsService,
    private readonly reader: LogReaderClient,
  ) {}

  targets(): UptimeTarget[] {
    return uptimeTargets(monitorEnvironment());
  }

  private async check(target: UptimeTarget): Promise<CheckResult> {
    const started = Date.now();
    const timed = async (
      probe: () => Promise<unknown>,
    ): Promise<CheckResult> => {
      try {
        await Promise.race([
          probe(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout ${CHECK_TIMEOUT_MS / 1000} s`)),
              CHECK_TIMEOUT_MS,
            ),
          ),
        ]);
        return {
          ok: true,
          status: null,
          latencyMs: Date.now() - started,
          error: null,
        };
      } catch (error) {
        return {
          ok: false,
          status: null,
          latencyMs: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };
    if (target.url === 'redis:') {
      return timed(async () => {
        if ((await this.redis.ping()) !== 'PONG') throw new Error('No PONG');
      });
    }
    if (target.url === 'mysql:') {
      if (!this.db.configured()) {
        return {
          ok: true,
          status: null,
          latencyMs: null,
          error: 'DATABASE_URL_MONITOR not set, not checked',
        };
      }
      return timed(() => this.db.ping());
    }
    return checkHttp(target.url);
  }

  /** One round: checks every target, stores samples, updates state. */
  async runChecks(now = Date.now()): Promise<Map<string, TargetState>> {
    const stateKey = this.store.key('uptime-state');
    const states = await this.store.hashJson<TargetState>(stateKey);
    const results = await Promise.all(
      this.targets().map(async (target) => ({
        target,
        result: await this.check(target),
      })),
    );
    const minute = Math.floor(now / 60_000);
    const updated = new Map<string, TargetState>();
    for (const { target, result } of results) {
      const previous: TargetState = states[target.id] ?? {
        consecutiveFailures: 0,
        lastStatus: null,
        lastLatencyMs: null,
        lastError: null,
        lastCheckedAt: null,
        firstFailureAt: null,
        down: false,
      };
      const next: TargetState = {
        ...previous,
        lastStatus: result.status,
        lastLatencyMs: result.latencyMs,
        lastError: result.error,
        lastCheckedAt: new Date(now).toISOString(),
      };
      if (result.ok) {
        if (previous.down && previous.firstFailureAt) {
          await this.recordIncident(
            target,
            previous.firstFailureAt,
            now,
            previous.lastError,
          );
        }
        next.consecutiveFailures = 0;
        next.firstFailureAt = null;
        next.down = false;
      } else {
        next.consecutiveFailures = previous.consecutiveFailures + 1;
        next.firstFailureAt =
          previous.firstFailureAt ?? new Date(now).toISOString();
        next.down = next.consecutiveFailures >= DOWN_AFTER;
      }
      updated.set(target.id, next);
      await this.store.client.hset(stateKey, target.id, JSON.stringify(next));
      const sampleKey = this.store.key(`uptime:${target.id}:${dayKey(now)}`);
      await this.store.client.append(
        sampleKey,
        `${minute},${result.ok ? 1 : 0},${result.latencyMs ?? ''};`,
      );
      await this.store.client.expire(sampleKey, SAMPLE_TTL_SECONDS);
    }
    await this.store.client.expire(stateKey, SAMPLE_TTL_SECONDS);
    return updated;
  }

  private async recordIncident(
    target: UptimeTarget,
    startedAt: string,
    now: number,
    error: string | null,
  ) {
    const incident: UptimeIncident = {
      targetId: target.id,
      label: target.label,
      startedAt,
      endedAt: new Date(now).toISOString(),
      durationSeconds: Math.round((now - Date.parse(startedAt)) / 1000),
      error,
    };
    await this.store.pushCapped(
      this.store.key('uptime-incidents'),
      incident,
      100,
      30 * 86_400,
    );
  }

  private async samples(id: string, sinceMs: number, now: number) {
    const keys = new Set<string>();
    for (let day = sinceMs; day < now + DAY_MS; day += DAY_MS) {
      keys.add(this.store.key(`uptime:${id}:${dayKey(Math.min(day, now))}`));
    }
    const raws = await this.store.client.mget(...[...keys]);
    const samples: Array<{
      time: number;
      ok: boolean;
      latency: number | null;
    }> = [];
    for (const raw of raws) {
      for (const part of (raw ?? '').split(';')) {
        const [minute, ok, latency] = part.split(',');
        if (!part || !minute) continue;
        const time = Number(minute) * 60_000;
        if (time < sinceMs) continue;
        samples.push({
          time,
          ok: ok === '1',
          latency:
            latency === '' || latency === undefined ? null : Number(latency),
        });
      }
    }
    return samples;
  }

  // ------------------------------------------------------------- TLS
  /** Cached for a day; `force` re-checks now. */
  async tls(force = false): Promise<TlsCertStatus[]> {
    const key = this.store.key('tls');
    const cached = await this.store.getJson<{
      at: number;
      certs: TlsCertStatus[];
    }>(key);
    if (!force && cached && Date.now() - cached.at < DAY_MS)
      return cached.certs;
    const certs = await Promise.all(
      tlsHosts(monitorEnvironment()).map((host) => checkTls(host)),
    );
    await this.store.setJson(key, { at: Date.now(), certs }, 2 * 86_400);
    return certs;
  }

  // ---------------------------------------------------------- backup
  async backup(maxAgeMs = 5 * 60_000): Promise<BackupStatus | null> {
    if (this.backupCache && Date.now() - this.backupCache.at < maxAgeMs)
      return this.backupCache.value;
    let value: BackupStatus | null = null;
    try {
      value = await this.reader.get<BackupStatus>('/backup/status');
    } catch (error) {
      this.logger.warn(`backup status unavailable: ${String(error)}`);
    }
    this.backupCache = { at: Date.now(), value };
    return value;
  }

  // -------------------------------------------------------- overview
  async overview(now = Date.now()): Promise<UptimeOverview> {
    const states = await this.store.hashJson<TargetState>(
      this.store.key('uptime-state'),
    );
    const targets: UptimeTargetStatus[] = [];
    for (const target of this.targets()) {
      const state = states[target.id];
      const week = await this.samples(target.id, now - 7 * DAY_MS, now);
      const day = week.filter((sample) => sample.time >= now - DAY_MS);
      const ratio = (list: typeof week) =>
        list.length
          ? Math.round(
              (list.filter((s) => s.ok).length / list.length) * 10000,
            ) / 100
          : null;
      targets.push({
        id: target.id,
        label: target.label,
        kind: target.kind,
        url: target.url,
        up: state ? !state.down && state.consecutiveFailures === 0 : null,
        lastStatus: state?.lastStatus ?? null,
        lastLatencyMs: state?.lastLatencyMs ?? null,
        lastError: state?.lastError ?? null,
        lastCheckedAt: state?.lastCheckedAt ?? null,
        consecutiveFailures: state?.consecutiveFailures ?? 0,
        uptime24h: ratio(day),
        uptime7d: ratio(week),
        latency24h: day
          .filter((sample) => sample.latency !== null)
          .map((sample) => [sample.time, sample.latency as number]),
      });
    }
    const incidents = await this.store.listJson<UptimeIncident>(
      this.store.key('uptime-incidents'),
      50,
    );
    // Ongoing incidents come from the state, not the list.
    for (const target of this.targets()) {
      const state = states[target.id];
      if (state?.down && state.firstFailureAt) {
        incidents.unshift({
          targetId: target.id,
          label: target.label,
          startedAt: state.firstFailureAt,
          endedAt: null,
          durationSeconds: null,
          error: state.lastError,
        });
      }
    }
    const tlsCached = await this.store.getJson<{
      at: number;
      certs: TlsCertStatus[];
    }>(this.store.key('tls'));
    return {
      targets,
      incidents,
      tls: tlsCached?.certs ?? [],
      backup: await this.backup(),
    };
  }
}
