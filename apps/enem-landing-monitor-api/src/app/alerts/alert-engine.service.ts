import { RedisService } from '@enem-landing/backend-redis';
import { SchedulerService } from '@enem-landing/backend-scheduler';
import type {
  AlertRuleId,
  ContainerInfo,
  ContainerList,
  ContainerMetricsList,
  HostMetrics,
  LogsSummary,
} from '@enem-landing/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DbStatsService } from '../db/db-stats.service.js';
import { RedisStatsService } from '../db/redis-stats.service.js';
import { DeployService, shortService } from '../deploy/deploy.service.js';
import { LogReaderClient } from '../logs/log-reader.client.js';
import { MetricsService } from '../metrics/metrics.service.js';
import {
  logsEnabled,
  monitorPrimary,
  schedulerEnabled,
} from '../monitor.config.js';
import { SecurityService } from '../security/security.service.js';
import { MonitorStore } from '../store/monitor-store.js';
import { UptimeService } from '../uptime/uptime.service.js';
import {
  type AlertEvent,
  AlertService,
  type Observation,
} from './alert.service.js';
import { AlertOutbox } from './alert-outbox.js';

const TASK_ID = 'monitor-alerts';
/** Every minute, 15 s past (the reader's container cache is 10 s). */
const CRON = '15 * * * * *';
/** Stopped containers older than this are history, not news (first run, restarts). */
const FRESH_CRASH_MS = 30 * 60_000;
const DAY_MS = 86_400_000;

const percent = (value: number) => `${Math.round(value * 10) / 10}%`;

/** Crash and OOM events from the container scan (only recent ones). */
export const crashEvents = (
  list: ContainerList,
  now = Date.now(),
): AlertEvent[] =>
  list.stopped
    .filter(
      (container) =>
        container.crashed &&
        container.finishedAt !== null &&
        now - Date.parse(container.finishedAt) < FRESH_CRASH_MS,
    )
    .map((container) => {
      const service = `${container.stack ? `${container.stack}/` : ''}${shortService(container)}`;
      const oom = container.oomKilled;
      return {
        ruleId: oom ? ('container-oom' as const) : ('container-crash' as const),
        key: `${oom ? 'container-oom' : 'container-crash'}:${container.service}`,
        eventId: container.id,
        title: oom
          ? `Container OOMKilled: ${service}`
          : `Container crash: ${service}`,
        summary: `${container.name} berhenti dengan exit ${container.exitCode ?? '-'}${oom ? ' (OOMKilled, melewati limit memory)' : ''}${container.error ? `: ${container.error}` : ''}.`,
        details: [
          `Service: ${container.service}`,
          `Container: ${container.id.slice(0, 12)}`,
          `Start: ${container.startedAt ?? '-'}`,
          `Berhenti: ${container.finishedAt}`,
        ],
        link: linkFor(container),
      };
    });

const linkFor = (container: Pick<ContainerInfo, 'category'>): string =>
  container.category === 'db'
    ? '/db'
    : container.category === 'redis'
      ? '/redis'
      : container.category === 'infra'
        ? '/server'
        : '/apps';

/** MySQL/Redis containers: down when no container of the service runs. */
export const datastoreObservations = (list: ContainerList): Observation[] => {
  const running = (service: string) =>
    list.running.some((container) => container.service === service);
  return [
    {
      ruleId: 'mysql-down',
      key: 'mysql-down',
      active: !running('mysql_mysql'),
      title: 'MySQL tidak jalan',
      summary: 'Tidak ada container mysql_mysql yang jalan.',
      link: '/db',
    },
    {
      ruleId: 'redis-down',
      key: 'redis-down',
      active: !running('redis_redis'),
      title: 'Redis tidak jalan',
      summary: 'Tidak ada container redis_redis yang jalan.',
      link: '/redis',
    },
  ];
};

/** Host and container gauges against the rule thresholds. */
export const metricObservations = (
  host: HostMetrics | null,
  containers: ContainerMetricsList | null,
  thresholds: { memory: number; disk: number; swap: number; load: number },
): Observation[] => {
  const observations: Observation[] = [];
  if (host) {
    for (const disk of host.disks) {
      observations.push({
        ruleId: 'disk-usage',
        key: `disk-usage:${disk.label}`,
        active: disk.percent > thresholds.disk,
        title: `Disk ${disk.label} ${percent(disk.percent)}`,
        summary: `Disk ${disk.label} terpakai ${percent(disk.percent)} (ambang ${thresholds.disk}%).`,
        link: '/server?tab=metrics',
      });
    }
    if (host.swap.total > 0) {
      observations.push({
        ruleId: 'swap-usage',
        key: 'swap-usage',
        active: host.swap.percent > thresholds.swap,
        title: `Swap ${percent(host.swap.percent)}`,
        summary: `Swap terpakai ${percent(host.swap.percent)} (ambang ${thresholds.swap}%).`,
        link: '/server?tab=metrics',
      });
    }
    const limit = thresholds.load * host.cpuCount;
    observations.push({
      ruleId: 'load-high',
      key: 'load-high',
      active: host.load[1] > limit,
      title: `Load ${host.load[1]} (${host.cpuCount} vCPU)`,
      summary: `Load rata-rata 5 menit ${host.load[1]}, ambang ${limit} (${thresholds.load}x ${host.cpuCount} vCPU).`,
      link: '/server?tab=metrics',
    });
  }
  for (const container of containers?.containers ?? []) {
    if (container.memoryPercent === null) continue;
    observations.push({
      ruleId: 'container-memory',
      key: `container-memory:${container.service}`,
      active: container.memoryPercent > thresholds.memory,
      title: `Memory ${container.service} ${percent(container.memoryPercent)}`,
      summary: `${container.service} memakai ${percent(container.memoryPercent)} dari limit memory-nya (ambang ${thresholds.memory}%). Risiko OOMKilled.`,
      link: '/apps?tab=memory',
    });
  }
  return observations;
};

/**
 * Runs every alert rule once a minute and then works through
 * the email outbox. Each check is independent: when a data source fails,
 * its rules are skipped this round instead of being treated as resolved.
 * Host-level sampling (metrics, deploy history) only runs on the primary
 * monitor (prod).
 */
@Injectable()
export class AlertEngine implements OnModuleInit {
  private readonly logger = new Logger(AlertEngine.name);

  constructor(
    private readonly scheduler: SchedulerService,
    private readonly alerts: AlertService,
    private readonly outbox: AlertOutbox,
    private readonly reader: LogReaderClient,
    private readonly store: MonitorStore,
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    private readonly uptime: UptimeService,
    private readonly security: SecurityService,
    private readonly db: DbStatsService,
    private readonly redisStats: RedisStatsService,
    private readonly deploy: DeployService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!schedulerEnabled()) return;
    await this.outbox
      .recover()
      .catch((error) =>
        this.logger.warn(`outbox recovery failed: ${String(error)}`),
      );
    this.scheduler.createCronJob(TASK_ID, CRON, () => this.tick(), 'UTC');
  }

  private async step(name: string, run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (error) {
      this.logger.warn(
        `check ${name} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async tick(): Promise<void> {
    const rules = await this.alerts.rules();
    const threshold = (id: AlertRuleId, fallback: number) =>
      rules.find((rule) => rule.id === id)?.threshold ?? fallback;

    if (logsEnabled()) {
      await this.step('containers', async () => {
        const list = await this.reader.get<ContainerList>('/containers');
        for (const event of crashEvents(list)) await this.alerts.raise(event);
        await this.alerts.observe(
          ['mysql-down', 'redis-down'],
          datastoreObservations(list),
        );
        if (monitorPrimary()) await this.deploy.record(list);
      });

      await this.step('kernel-oom', async () => {
        const summary = await this.reader.get<LogsSummary>('/summary');
        if (summary.oomEvents === null) return;
        const key = this.store.key('alert-last:kernel-oom');
        const previous = await this.store.client.get(key);
        await this.store.client.set(
          key,
          String(summary.oomEvents),
          'EX',
          30 * 86_400,
        );
        // First run (or a rotated kern.log, which lowers the count) sets the baseline.
        if (previous !== null && summary.oomEvents > Number(previous)) {
          await this.alerts.raise({
            ruleId: 'kernel-oom',
            key: 'kernel-oom',
            eventId: `${Date.now()}`,
            title: 'Event OOM kernel baru',
            summary: `Baris OOM di kern.log naik dari ${previous} menjadi ${summary.oomEvents}. Kernel membunuh proses karena RAM host habis.`,
            link: '/server',
          });
        }
      });

      await this.step('failed-logins', async () => {
        const { count } = await this.reader.get<{ count: number | null }>(
          '/security/failed-count',
          { minutes: '60' },
        );
        if (count === null) return;
        const limit = threshold('failed-login-spike', 2000);
        await this.alerts.observe(
          ['failed-login-spike'],
          [
            {
              ruleId: 'failed-login-spike',
              key: 'failed-login-spike',
              active: count > limit,
              title: `Lonjakan login gagal: ${count} per jam`,
              summary: `${count} login gagal dalam 60 menit terakhir (ambang ${limit}).`,
              link: '/server?tab=analysis',
            },
          ],
        );
      });

      await this.step('metrics', async () => {
        const [host, containers] = await Promise.all([
          this.metrics.host().catch(() => null),
          this.metrics.containers().catch(() => null),
        ]);
        if (monitorPrimary()) await this.metrics.record(host, containers);
        const covered: AlertRuleId[] = [];
        if (host) covered.push('disk-usage', 'swap-usage', 'load-high');
        if (containers) covered.push('container-memory');
        await this.alerts.observe(
          covered,
          metricObservations(host, containers, {
            memory: threshold('container-memory', 90),
            disk: threshold('disk-usage', 80),
            swap: threshold('swap-usage', 50),
            load: threshold('load-high', 2),
          }),
        );
      });

      await this.step('logins', () => this.checkLogins());
      await this.step('backup', () =>
        this.checkBackup(threshold('backup-stale', 26)),
      );
    }

    await this.step('redis-ping', async () => {
      let ok = false;
      try {
        ok = (await this.redis.ping()) === 'PONG';
      } catch {
        ok = false;
      }
      await this.alerts.observe(
        ['redis-ping'],
        [
          {
            ruleId: 'redis-ping',
            key: 'redis-ping',
            active: !ok,
            title: 'Redis tidak bisa di-ping',
            summary: 'PING dari enem-landing-monitor-api ke Redis gagal.',
            link: '/redis',
          },
        ],
      );
    });

    await this.step('uptime', async () => {
      const states = await this.uptime.runChecks();
      const targets = this.uptime.targets();
      await this.alerts.observe(
        ['uptime-down'],
        targets.map((target) => {
          const state = states.get(target.id);
          return {
            ruleId: 'uptime-down' as const,
            key: `uptime-down:${target.id}`,
            active: (state?.consecutiveFailures ?? 0) > 0,
            title: `Down: ${target.label}`,
            summary: `${target.label} gagal dicek: ${state?.lastError ?? '-'}.`,
            details: [`Target: ${target.url}`],
            link: '/uptime',
          };
        }),
      );
    });

    await this.step('tls', async () => {
      const certs = await this.uptime.tls();
      const limit = threshold('tls-expiry', 14);
      await this.alerts.observe(
        ['tls-expiry'],
        certs
          .filter((cert) => cert.daysLeft !== null)
          .map((cert) => ({
            ruleId: 'tls-expiry' as const,
            key: `tls-expiry:${cert.host}`,
            active: (cert.daysLeft as number) < limit,
            title: `Sertifikat ${cert.host} sisa ${cert.daysLeft} hari`,
            summary: `Sertifikat TLS ${cert.host} berlaku sampai ${cert.validTo} (sisa ${cert.daysLeft} hari, ambang ${limit}). Cek renewal ACME DNS-01 Traefik dan token Cloudflare.`,
            link: '/uptime',
          })),
      );
    });

    await this.step('mysql', async () => {
      if (!this.db.configured()) return;
      const stats = await this.db.stats();
      if (
        !stats.connected ||
        !stats.maxConnections ||
        stats.threadsConnected === null
      )
        return;
      const limit = threshold('mysql-connections', 80);
      const used = (stats.threadsConnected / stats.maxConnections) * 100;
      await this.alerts.observe(
        ['mysql-connections'],
        [
          {
            ruleId: 'mysql-connections',
            key: 'mysql-connections',
            active: used > limit,
            title: `Koneksi MySQL ${stats.threadsConnected}/${stats.maxConnections}`,
            summary: `Threads_connected ${stats.threadsConnected} dari max_connections ${stats.maxConnections} (${percent(used)}, ambang ${limit}%).`,
            link: '/db',
          },
        ],
      );
    });

    await this.step('redis-info', async () => {
      const stats = await this.redisStats.stats(false);
      if (!stats.connected) return;
      const observations: Observation[] = [];
      const covered: AlertRuleId[] = ['redis-aof'];
      if (stats.memoryPercent !== null) {
        covered.push('redis-memory');
        const limit = threshold('redis-memory', 85);
        observations.push({
          ruleId: 'redis-memory',
          key: 'redis-memory',
          active: stats.memoryPercent > limit,
          title: `Memory Redis ${percent(stats.memoryPercent)}`,
          summary: `used_memory ${percent(stats.memoryPercent)} dari maxmemory (ambang ${limit}%).`,
          link: '/redis',
        });
      }
      const aofBad =
        (stats.aofLastWriteStatus !== null &&
          stats.aofLastWriteStatus !== 'ok') ||
        (stats.aofLastRewriteStatus !== null &&
          stats.aofLastRewriteStatus !== 'ok');
      observations.push({
        ruleId: 'redis-aof',
        key: 'redis-aof',
        active: aofBad,
        title: 'AOF Redis gagal',
        summary: `aof_last_write_status=${stats.aofLastWriteStatus ?? '-'}, aof_last_bgrewrite_status=${stats.aofLastRewriteStatus ?? '-'}.`,
        link: '/redis',
      });
      await this.alerts.observe(covered, observations);

      if (stats.evictedKeys !== null) {
        const key = this.store.key('alert-last:redis-evictions');
        const previous = await this.store.client.get(key);
        await this.store.client.set(
          key,
          String(stats.evictedKeys),
          'EX',
          30 * 86_400,
        );
        if (previous !== null && stats.evictedKeys > Number(previous)) {
          await this.alerts.raise({
            ruleId: 'redis-evictions',
            key: 'redis-evictions',
            eventId: `${Date.now()}`,
            title: 'Redis mengeluarkan key (eviction)',
            summary: `evicted_keys naik dari ${previous} menjadi ${stats.evictedKeys}: maxmemory penuh, cache atau token bisa hilang.`,
            link: '/redis',
          });
        }
      }
    });

    await this.step('outbox', async () => {
      await this.outbox.process((id, status) =>
        this.alerts.setStatus(id, status),
      );
    });
  }

  /** Successful SSH logins of the last hour. */
  private async checkLogins(): Promise<void> {
    const known = new Set(
      (await this.security.knownIps()).map((entry) => entry.ip),
    );
    if (known.size === 0) {
      // First run: everything that logged in with a key this week is "known".
      for (const login of await this.security.recentLogins(168)) {
        if (login.method === 'publickey' && login.ip && !known.has(login.ip)) {
          await this.security.addKnownIp(
            login.ip,
            'otomatis (publickey)',
            true,
          );
          known.add(login.ip);
        }
      }
    }
    for (const login of await this.security.recentLogins(1)) {
      const eventId = `${login.time}|${login.user}|${login.ip}`;
      const details = [
        `User: ${login.user}`,
        `IP: ${login.ip}`,
        `Metode: ${login.method}`,
        `Waktu: ${login.time}`,
        `Sumber: ${login.source}`,
      ];
      if (login.ip && !known.has(login.ip)) {
        await this.alerts.raise({
          ruleId: 'login-new-ip',
          key: `login-new-ip:${login.ip}`,
          eventId,
          title: `Login SSH dari IP baru: ${login.ip}`,
          summary: `${login.user} login dari ${login.ip} (${login.method}), IP ini belum ada di daftar IP dikenal. Kalau bukan Anda, segera periksa server.`,
          details,
          link: '/server?tab=analysis',
        });
      }
      if (login.method === 'password') {
        await this.alerts.raise({
          ruleId: 'login-password',
          key: `login-password:${login.user}`,
          eventId,
          title: `Login SSH memakai password: ${login.user}`,
          summary: `${login.user} login dari ${login.ip} memakai password, bukan key.`,
          details,
          link: '/server?tab=analysis',
        });
      }
      if (login.user === 'root') {
        await this.alerts.raise({
          ruleId: 'login-root',
          key: 'login-root',
          eventId,
          title: 'Login SSH sebagai root',
          summary: `root login dari ${login.ip} (${login.method}).`,
          details,
          link: '/server?tab=analysis',
        });
      }
      if (login.method === 'publickey' && login.ip && !known.has(login.ip)) {
        await this.security.addKnownIp(login.ip, 'otomatis (publickey)', true);
        known.add(login.ip);
      }
    }
  }

  /** Backup older than the threshold, or the last run failed. */
  private async checkBackup(hours: number): Promise<void> {
    const status = await this.uptime.backup(60_000);
    if (!status?.available) return;
    const lastOk = status.lastSuccessAt ? Date.parse(status.lastSuccessAt) : 0;
    const stale = Date.now() - lastOk > hours * 3_600_000;
    const failed = status.lastRun !== null && !status.lastRun.ok;
    await this.alerts.observe(
      ['backup-stale'],
      [
        {
          ruleId: 'backup-stale',
          key: 'backup-stale',
          active: stale || failed,
          title: failed
            ? 'Backup MySQL terakhir gagal'
            : 'Backup MySQL terlambat',
          summary: failed
            ? `Run terakhir gagal: ${status.lastRun?.message}`
            : `Backup sukses terakhir ${status.lastSuccessAt ?? 'tidak ada dalam 30 hari'}, lebih dari ${hours} jam lalu (seharusnya tiap ${DAY_MS / 3_600_000} jam).`,
          details: status.runs
            .slice(0, 5)
            .map(
              (run) => `${run.time} ${run.ok ? 'OK' : 'GAGAL'} ${run.message}`,
            ),
          link: '/uptime',
        },
      ],
    );
  }
}
