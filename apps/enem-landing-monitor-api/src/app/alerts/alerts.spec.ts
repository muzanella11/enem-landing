import type { MonitorAlertEmailPayload } from '@enem-landing/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeRedis } from '../store/fake-redis.js';
import { MonitorStore } from '../store/monitor-store.js';
import type { AlertMailer, MailResult } from './alert-mailer.js';
import { AlertOutbox, OUTBOX_MAX, RETRY_DELAYS_MS } from './alert-outbox.js';
import { applyOverrides } from './alert-rules.js';
import { AlertService } from './alert.service.js';
import {
  crashEvents,
  datastoreObservations,
  metricObservations,
} from './alert-engine.service.js';
import { keyMatches } from './hooks.controller.js';

const mailer = (results: MailResult[] | (() => Promise<MailResult>)) => {
  const send = vi.fn(async (payload: MonitorAlertEmailPayload) =>
    payload && typeof results === 'function'
      ? results()
      : (results.shift() ?? { status: 'sent' as const }),
  );
  return { send } as unknown as AlertMailer & { send: typeof send };
};

const setup = (results: MailResult[] = []) => {
  const redis = new FakeRedis();
  const store = MonitorStore.forTesting(redis);
  const mail = mailer(results);
  const outbox = new AlertOutbox(store, mail);
  const alerts = new AlertService(store, outbox);
  const writeStatus = (
    id: string,
    status: Parameters<AlertService['setStatus']>[1],
  ) => alerts.setStatus(id, status);
  return { redis, store, mail, outbox, alerts, writeStatus };
};

const crash = {
  ruleId: 'container-crash' as const,
  key: 'container-crash:enem-landing_enem-landing-api',
  title: 'Container crash: enem-landing-api',
  summary: 'exit 1',
  link: '/apps',
};

describe('alerts', () => {
  beforeEach(() => {
    process.env['ALERTS_EMAIL_ENABLED'] = 'true';
    process.env['MONITOR_ENV'] = 'prod';
  });
  afterEach(() => {
    delete process.env['ALERTS_EMAIL_ENABLED'];
    delete process.env['MONITOR_ENV'];
  });

  it('records but never emails in dev', async () => {
    process.env['ALERTS_EMAIL_ENABLED'] = 'false';
    const { alerts, outbox } = setup();
    const entry = await alerts.raise({ ...crash, eventId: 'c1' });
    expect(entry?.emailStatus).toBe('dev-disabled');
    expect(await outbox.size()).toBe(0);
    expect((await alerts.history())[0].id).toBe(entry?.id);
  });

  it('reports one event once, and a crash loop once per cooldown', async () => {
    const { alerts, outbox } = setup();
    expect((await alerts.raise({ ...crash, eventId: 'c1' }))?.emailStatus).toBe(
      'queued',
    );
    expect(await alerts.raise({ ...crash, eventId: 'c1' })).toBeNull();
    for (let index = 2; index <= 30; index += 1) {
      expect(
        (await alerts.raise({ ...crash, eventId: `c${index}` }))?.emailStatus,
      ).toBe('cooldown');
    }
    expect(await outbox.size()).toBe(1);
    const history = await alerts.history();
    expect(history).toHaveLength(30);
    expect(
      history.filter((entry) => entry.emailStatus === 'cooldown'),
    ).toHaveLength(29);
  });

  it('fires a stateful rule after the required checks, then resolves once', async () => {
    const { alerts } = setup();
    const down = datastoreObservations({
      running: [],
      stopped: [],
      scannedAt: '',
    });
    expect(
      await alerts.observe(['mysql-down', 'redis-down'], down),
    ).toHaveLength(0);
    const fired = await alerts.observe(['mysql-down', 'redis-down'], down);
    expect(fired.map((entry) => entry.ruleId).sort()).toEqual([
      'mysql-down',
      'redis-down',
    ]);
    expect(
      await alerts.observe(['mysql-down', 'redis-down'], down),
    ).toHaveLength(0);
    expect((await alerts.overview()).active).toHaveLength(2);

    const up = down.map((observation) => ({ ...observation, active: false }));
    const resolved = await alerts.observe(['mysql-down', 'redis-down'], up);
    expect(resolved.map((entry) => entry.kind)).toEqual([
      'resolved',
      'resolved',
    ]);
    expect(resolved[0].summary).toContain('Durasi masalah');
    expect(await alerts.observe(['mysql-down', 'redis-down'], up)).toHaveLength(
      0,
    );
  });

  it('resolves a condition whose key disappeared', async () => {
    const { alerts } = setup();
    await alerts.updateRule('container-memory', { threshold: 90 });
    const high = metricObservations(
      null,
      {
        time: '',
        totalLimits: 0,
        hostMemory: 0,
        containers: [
          {
            id: 'x',
            name: 'x',
            service: 'enem-landing_enem-landing-cms',
            stack: 'enem-landing',
            category: 'apps-prod',
            memoryCurrent: 95,
            memoryMax: 100,
            memoryPeak: 99,
            memoryPercent: 95,
            oomKills: 0,
            cpuPercent: 1,
          },
        ],
      },
      { memory: 90, disk: 80, swap: 50, load: 2 },
    );
    for (let check = 1; check <= 4; check += 1) {
      expect(await alerts.observe(['container-memory'], high)).toHaveLength(0);
    }
    expect(await alerts.observe(['container-memory'], high)).toHaveLength(1);
    const resolved = await alerts.observe(['container-memory'], []);
    expect(resolved[0]).toMatchObject({ kind: 'resolved' });
  });

  it('skips disabled rules and validates thresholds', async () => {
    const { alerts } = setup();
    await alerts.updateRule('container-crash', { enabled: false });
    expect(await alerts.raise({ ...crash, eventId: 'c1' })).toBeNull();
    await expect(
      alerts.updateRule('disk-usage', { threshold: 5 }),
    ).rejects.toThrow();
    await expect(
      alerts.updateRule('nope', { enabled: true }),
    ).rejects.toThrow();
    expect(
      applyOverrides({ 'disk-usage': { threshold: 500 } }).find(
        (r) => r.id === 'disk-usage',
      )?.threshold,
    ).toBe(80);
  });
});

describe('alert outbox', () => {
  beforeEach(() => {
    process.env['ALERTS_EMAIL_ENABLED'] = 'true';
  });
  afterEach(() => {
    delete process.env['ALERTS_EMAIL_ENABLED'];
  });

  it('sends queued alerts and marks them sent', async () => {
    const { alerts, outbox, writeStatus, mail } = setup();
    const entry = await alerts.raise({ ...crash, eventId: 'c1' });
    expect(await outbox.process(writeStatus)).toBe(1);
    expect(mail.send).toHaveBeenCalledOnce();
    expect(mail.send.mock.calls[0][0].url).toBe('http://localhost:4003/apps');
    expect((await alerts.history())[0]).toMatchObject({
      id: entry?.id,
      emailStatus: 'sent',
    });
    expect(await outbox.size()).toBe(0);
  });

  it('records the CMS switch being off without retrying', async () => {
    const { alerts, outbox, writeStatus } = setup([{ status: 'cms-disabled' }]);
    await alerts.raise({ ...crash, eventId: 'c1' });
    await outbox.process(writeStatus);
    expect((await alerts.history())[0].emailStatus).toBe('cms-disabled');
    expect(await outbox.size()).toBe(0);
  });

  it('retries after 1, 5, 15 and 60 minutes, then gives up with the error', async () => {
    const error: MailResult = {
      status: 'error',
      error: 'account-api unreachable',
    };
    const { alerts, outbox, writeStatus, mail } = setup([
      error,
      error,
      error,
      error,
      error,
    ]);
    await alerts.raise({ ...crash, eventId: 'c1' });
    let now = 0;
    const clock = () => now;
    await outbox.process(writeStatus, clock);
    for (const delay of RETRY_DELAYS_MS) {
      expect(await outbox.size()).toBe(1);
      expect((await alerts.history())[0]).toMatchObject({
        emailStatus: 'queued',
      });
      now += delay - 1;
      await outbox.process(writeStatus, clock);
      now += 1;
      await outbox.process(writeStatus, clock);
    }
    expect(mail.send).toHaveBeenCalledTimes(5);
    expect(await outbox.size()).toBe(0);
    expect((await alerts.history())[0]).toMatchObject({
      emailStatus: 'failed',
      emailError: 'account-api unreachable',
    });
  });

  it('delivers once account-api is back', async () => {
    const { alerts, outbox, writeStatus } = setup([
      { status: 'error', error: 'down' },
      { status: 'sent' },
    ]);
    await alerts.raise({ ...crash, eventId: 'c1' });
    await outbox.process(writeStatus, () => 0);
    await outbox.process(writeStatus, () => RETRY_DELAYS_MS[0]);
    expect((await alerts.history())[0]).toMatchObject({
      emailStatus: 'sent',
      emailAttempts: 2,
    });
  });

  it('never gives the same item to two processors (atomic LMOVE)', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const redis = new FakeRedis();
    const store = MonitorStore.forTesting(redis);
    const slow = mailer(async () => {
      await gate;
      return { status: 'sent' };
    });
    const first = new AlertOutbox(store, slow);
    const second = new AlertOutbox(store, slow);
    const alerts = new AlertService(store, first);
    await alerts.raise({ ...crash, eventId: 'c1' });
    const write = (
      id: string,
      status: Parameters<AlertService['setStatus']>[1],
    ) => alerts.setStatus(id, status);
    const a = first.process(write);
    const b = second.process(write);
    release();
    expect((await a) + (await b)).toBe(1);
    expect(slow.send).toHaveBeenCalledOnce();
  });

  it('keeps items across a restart and does not send them twice', async () => {
    const redis = new FakeRedis();
    const store = MonitorStore.forTesting(redis);
    const crashed = new AlertOutbox(
      store,
      mailer(async () => {
        throw new Error('process killed mid-send');
      }),
    );
    const alerts = new AlertService(store, crashed);
    await alerts.raise({ ...crash, eventId: 'c1' });
    await expect(crashed.process(() => Promise.resolve())).rejects.toThrow();
    expect(await redis.llen('monitor:alert-processing')).toBe(1);
    expect(await crashed.size()).toBe(0);

    const restarted = new AlertOutbox(store, mailer([{ status: 'sent' }]));
    expect(await restarted.recover()).toBe(1);
    expect(
      await restarted.process((id, status) => alerts.setStatus(id, status)),
    ).toBe(1);
    expect(
      await restarted.process((id, status) => alerts.setStatus(id, status)),
    ).toBe(0);
    expect(await redis.llen('monitor:alert-processing')).toBe(0);
  });

  it('never holds more than 200 items and reports the dropped ones', async () => {
    const { alerts, outbox } = setup();
    await alerts.updateRule('container-crash', { cooldownMinutes: 0 });
    for (let index = 0; index < OUTBOX_MAX + 5; index += 1) {
      await alerts.raise({ ...crash, eventId: `c${index}` });
    }
    expect(await outbox.size()).toBe(OUTBOX_MAX);
    const history = await alerts.history();
    expect(
      history.filter((entry) => entry.emailStatus === 'dropped'),
    ).toHaveLength(5);
  });
});

describe('alert checks', () => {
  it('only reports recent crashes', () => {
    const now = Date.parse('2026-11-23T10:00:00Z');
    const base = {
      name: 'x',
      service: 'enem-landing_enem-landing-api',
      stack: 'enem-landing',
      category: 'apps-prod' as const,
      running: false,
      startedAt: null,
      exitCode: 137,
      error: '',
      restartCount: 0,
      crashed: true,
      recentCrash: false,
      files: [],
      image: '',
      imageId: '',
      createdAt: null,
      version: null,
      revision: null,
      source: null,
      imageCreated: null,
    };
    const events = crashEvents(
      {
        running: [],
        stopped: [
          {
            ...base,
            id: 'a',
            finishedAt: '2026-11-23T09:55:00Z',
            oomKilled: true,
          },
          {
            ...base,
            id: 'b',
            finishedAt: '2026-11-23T05:00:00Z',
            oomKilled: false,
          },
        ],
        scannedAt: '',
      },
      now,
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ ruleId: 'container-oom', eventId: 'a' });
  });

  it('compares webhook keys in constant time', () => {
    expect(keyMatches('k'.repeat(40), 'k'.repeat(40))).toBe(true);
    expect(keyMatches('k'.repeat(39), 'k'.repeat(40))).toBe(false);
    expect(keyMatches(undefined, 'k'.repeat(40))).toBe(false);
  });
});
