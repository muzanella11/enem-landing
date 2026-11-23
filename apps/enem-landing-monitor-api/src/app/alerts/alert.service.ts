import type {
  AlertEmailStatus,
  AlertEntry,
  AlertKind,
  AlertRule,
  AlertRuleId,
  AlertRuleUpdate,
  AlertsOverview,
} from '@enem-landing/shared-types';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  alertsEmailEnabled,
  monitorEnvironment,
  monitorPublicUrl,
} from '../monitor.config.js';
import { MonitorStore } from '../store/monitor-store.js';
import {
  applyOverrides,
  findDefinition,
  requiredChecksOf,
  type RuleDefinition,
  type RuleOverrides,
} from './alert-rules.js';
import { AlertOutbox } from './alert-outbox.js';

export const HISTORY_MAX = 500;
const DAY_SECONDS = 86_400;
export const HISTORY_TTL_SECONDS = 30 * DAY_SECONDS;
const MAX_DETAILS = 30;

/** Something that happened once (a crash, a login). */
export interface AlertEvent {
  ruleId: AlertRuleId;
  /** Cooldown key, e.g. `container-crash:enem-landing_enem-landing-api`. */
  key: string;
  /** Unique id of the occurrence, so it is reported once (container id, login). */
  eventId: string;
  title: string;
  summary: string;
  details?: string[];
  link: string;
}

/** The current state of a condition (MySQL running, disk at 85%). */
export interface Observation {
  ruleId: AlertRuleId;
  key: string;
  active: boolean;
  title: string;
  summary: string;
  details?: string[];
  link: string;
}

interface ConditionState {
  ruleId: AlertRuleId;
  count: number;
  firing: boolean;
  since: string;
  firedAt?: string;
  title: string;
  link: string;
}

interface StatusRecord {
  emailStatus: AlertEmailStatus;
  emailError?: string;
  emailAttempts?: number;
}

const formatDuration = (ms: number): string => {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam ${minutes % 60} menit`;
};

/**
 * Alert bookkeeping in Redis, per environment:
 * - `alert-rules`: overrides on top of RULE_DEFINITIONS;
 * - `alerts`: history list, newest first, max 500 entries, 30 days;
 * - `alert-status:<id>`: email status of a history entry (updated by the outbox);
 * - `alert-states`: hash of stateful conditions currently counting or firing;
 * - `alert-cooldown:<key>` and `alert-seen:<eventId>`: dedup keys with TTLs.
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private readonly store: MonitorStore,
    private readonly outbox: AlertOutbox,
  ) {}

  // ------------------------------------------------------------- rules
  async rules(): Promise<RuleDefinition[]> {
    return applyOverrides(
      await this.store.getJson<RuleOverrides>(this.store.key('alert-rules')),
    );
  }

  async publicRules(): Promise<AlertRule[]> {
    return (await this.rules()).map((definition) => ({
      id: definition.id,
      label: definition.label,
      description: definition.description,
      severity: definition.severity,
      enabled: definition.enabled,
      threshold: definition.threshold,
      thresholdUnit: definition.thresholdUnit,
      cooldownMinutes: definition.cooldownMinutes,
      stateful: definition.stateful,
    }));
  }

  async rule(id: AlertRuleId): Promise<RuleDefinition | undefined> {
    return (await this.rules()).find((definition) => definition.id === id);
  }

  async updateRule(id: string, update: AlertRuleUpdate): Promise<AlertRule[]> {
    const definition = findDefinition(id);
    if (!definition) throw new BadRequestException('Unknown rule');
    if (update.threshold !== undefined) {
      if (definition.threshold === null)
        throw new BadRequestException('This rule has no threshold');
      if (
        update.threshold < (definition.min ?? -Infinity) ||
        update.threshold > (definition.max ?? Infinity)
      )
        throw new BadRequestException(
          `threshold must be between ${definition.min} and ${definition.max}`,
        );
    }
    const key = this.store.key('alert-rules');
    const overrides =
      (await this.store.getJson<RuleOverrides>(key)) ?? ({} as RuleOverrides);
    overrides[definition.id] = { ...overrides[definition.id], ...update };
    // No TTL would mean a key that never expires; a year is "forever" here.
    await this.store.setJson(key, overrides, 365 * DAY_SECONDS);
    if (update.enabled === false) await this.clearStates(definition.id);
    return this.publicRules();
  }

  // ----------------------------------------------------------- history
  async history(limit = HISTORY_MAX): Promise<AlertEntry[]> {
    const entries = await this.store.listJson<AlertEntry>(
      this.store.key('alerts'),
      limit,
    );
    if (!entries.length) return entries;
    const statuses = await this.store.client.mget(
      ...entries.map((entry) => this.store.key(`alert-status:${entry.id}`)),
    );
    return entries.map((entry, index) => {
      const raw = statuses[index];
      if (!raw) return entry;
      try {
        return { ...entry, ...(JSON.parse(raw) as StatusRecord) };
      } catch {
        return entry;
      }
    });
  }

  async setStatus(id: string, status: StatusRecord): Promise<void> {
    await this.store.setJson(
      this.store.key(`alert-status:${id}`),
      status,
      HISTORY_TTL_SECONDS,
    );
  }

  async overview(): Promise<AlertsOverview> {
    const history = await this.history(200);
    const since = Date.now() - DAY_SECONDS * 1000;
    const states = await this.store.hashJson<ConditionState>(
      this.store.key('alert-states'),
    );
    return {
      last24h: history.filter(
        (entry) => entry.kind === 'firing' && Date.parse(entry.time) >= since,
      ).length,
      latest: history[0] ?? null,
      active: Object.entries(states)
        .filter(([, state]) => state.firing)
        .map(([key, state]) => ({
          key,
          ruleId: state.ruleId,
          since: state.firedAt ?? state.since,
          title: state.title,
        })),
      outboxSize: await this.outbox.size(),
      emailEnabled: alertsEmailEnabled(),
    };
  }

  // -------------------------------------------------------------- emit
  /** Records an alert in the history and decides what happens to its email. */
  async emit(
    definition: RuleDefinition,
    kind: AlertKind,
    alert: {
      key: string;
      title: string;
      summary: string;
      details?: string[];
      link: string;
    },
  ): Promise<AlertEntry> {
    const entry: AlertEntry = {
      id: randomUUID(),
      time: new Date().toISOString(),
      environment: monitorEnvironment(),
      ruleId: definition.id,
      key: alert.key,
      kind,
      severity: kind === 'resolved' ? 'info' : definition.severity,
      title: alert.title.slice(0, 200),
      summary: alert.summary.slice(0, 2000),
      details: (alert.details ?? [])
        .slice(-MAX_DETAILS)
        .map((line) => line.slice(0, 1000)),
      link: alert.link,
      emailStatus: 'queued',
    };

    if (!alertsEmailEnabled()) {
      entry.emailStatus = 'dev-disabled';
    } else if (
      kind === 'firing' &&
      definition.cooldownMinutes > 0 &&
      !(await this.store.setIfAbsent(
        this.store.key(`alert-cooldown:${alert.key}`),
        entry.id,
        definition.cooldownMinutes * 60,
      ))
    ) {
      entry.emailStatus = 'cooldown';
    }

    await this.store.pushCapped(
      this.store.key('alerts'),
      entry,
      HISTORY_MAX,
      HISTORY_TTL_SECONDS,
    );

    if (entry.emailStatus === 'queued') {
      const dropped = await this.outbox.enqueue({
        historyId: entry.id,
        attempts: 0,
        nextAttemptAt: 0,
        payload: {
          title: entry.title,
          severity: entry.severity,
          kind,
          environment: entry.environment,
          time: entry.time,
          summary: entry.summary,
          details: entry.details,
          url: `${monitorPublicUrl()}${entry.link}`,
        },
      });
      for (const id of dropped) {
        await this.setStatus(id, { emailStatus: 'dropped' });
      }
    }
    this.logger.log(
      `alert ${kind} ${definition.id} key=${alert.key} email=${entry.emailStatus}`,
    );
    return entry;
  }

  /** One-off events, reported once per `eventId` (kept 7 days). */
  async raise(event: AlertEvent): Promise<AlertEntry | null> {
    const definition = await this.rule(event.ruleId);
    if (!definition?.enabled) return null;
    const fresh = await this.store.setIfAbsent(
      this.store.key(`alert-seen:${event.ruleId}:${event.eventId}`),
      '1',
      7 * DAY_SECONDS,
    );
    if (!fresh) return null;
    return this.emit(definition, 'firing', event);
  }

  /**
   * Feeds one round of checks for stateful rules. A condition fires after
   * `requiredChecks` consecutive active observations and resolves (one
   * "resolved" alert) on the first inactive one. Keys of `ruleIds` that are
   * missing from `observations` count as inactive (container gone), so
   * pass only the rules whose data source was actually read this round.
   */
  async observe(
    ruleIds: AlertRuleId[],
    observations: Observation[],
  ): Promise<AlertEntry[]> {
    const rules = await this.rules();
    const statesKey = this.store.key('alert-states');
    const states = await this.store.hashJson<ConditionState>(statesKey);
    const emitted: AlertEntry[] = [];
    const seen = new Set<string>();

    for (const observation of observations) {
      const definition = rules.find((rule) => rule.id === observation.ruleId);
      if (!definition?.enabled || !definition.stateful) continue;
      seen.add(observation.key);
      const state = states[observation.key];
      if (observation.active) {
        const next: ConditionState = state ?? {
          ruleId: observation.ruleId,
          count: 0,
          firing: false,
          since: new Date().toISOString(),
          title: observation.title,
          link: observation.link,
        };
        next.count += 1;
        next.title = observation.title;
        if (!next.firing && next.count >= requiredChecksOf(definition)) {
          next.firing = true;
          next.firedAt = new Date().toISOString();
          emitted.push(await this.emit(definition, 'firing', observation));
        }
        await this.store.client.hset(
          statesKey,
          observation.key,
          JSON.stringify(next),
        );
      } else if (state) {
        await this.store.client.hdel(statesKey, observation.key);
        if (state.firing) {
          emitted.push(
            await this.emitResolved(
              definition,
              observation.key,
              state,
              observation,
            ),
          );
        }
      }
    }

    // Conditions that disappeared (a container that no longer exists).
    for (const [key, state] of Object.entries(states)) {
      if (seen.has(key) || !ruleIds.includes(state.ruleId)) continue;
      await this.store.client.hdel(statesKey, key);
      const definition = rules.find((rule) => rule.id === state.ruleId);
      if (state.firing && definition?.enabled) {
        emitted.push(await this.emitResolved(definition, key, state));
      }
    }
    return emitted;
  }

  private emitResolved(
    definition: RuleDefinition,
    key: string,
    state: ConditionState,
    observation?: Observation,
  ): Promise<AlertEntry> {
    // From the first failing check, not from when the alert fired.
    const since = Date.parse(state.since);
    return this.emit(definition, 'resolved', {
      key,
      title: `Pulih: ${state.title}`,
      summary: `${observation?.summary ? `${observation.summary}. ` : ''}Durasi masalah: ${formatDuration(Date.now() - since)}.`,
      details: observation?.details,
      link: observation?.link ?? state.link,
    });
  }

  private async clearStates(ruleId: AlertRuleId): Promise<void> {
    const statesKey = this.store.key('alert-states');
    const states = await this.store.hashJson<ConditionState>(statesKey);
    const keys = Object.entries(states)
      .filter(([, state]) => state.ruleId === ruleId)
      .map(([key]) => key);
    if (keys.length) await this.store.client.hdel(statesKey, ...keys);
  }
}
