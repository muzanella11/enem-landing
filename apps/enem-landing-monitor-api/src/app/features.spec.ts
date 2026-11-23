import type { ContainerInfo } from '@enem-landing/shared-types';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { parseInfo, prefixOf } from './db/redis-stats.service.js';
import {
  compareUrl,
  DeployService,
  isRollback,
} from './deploy/deploy.service.js';
import { parseSeries, MetricsService } from './metrics/metrics.service.js';
import { FakeRedis } from './store/fake-redis.js';
import { MonitorStore } from './store/monitor-store.js';
import { UptimeController } from './uptime/uptime.controller.js';
import { tlsHosts, uptimeTargets } from './uptime/uptime-targets.js';
import type { LogReaderClient } from './logs/log-reader.client.js';

const container = (overrides: Partial<ContainerInfo>): ContainerInfo => ({
  id: 'a'.repeat(64),
  name: 'x',
  service: 'enem-landing_enem-landing-api',
  stack: 'enem-landing',
  category: 'apps-prod',
  running: true,
  startedAt: '2026-11-23T10:00:00Z',
  finishedAt: null,
  exitCode: null,
  oomKilled: false,
  error: '',
  restartCount: 0,
  crashed: false,
  recentCrash: false,
  files: [],
  image: 'ghcr.io/muzanella11/enem-landing-api:prod',
  imageId: '',
  createdAt: '2026-11-23T10:00:00Z',
  version: 'v1.2.0',
  revision: 'aaaaaaa1',
  source: 'https://github.com/muzanella11/enem-landing',
  imageCreated: '2026-11-23T09:00:00Z',
  ...overrides,
});

describe('uptime targets', () => {
  it('are fixed per environment', () => {
    expect(uptimeTargets('prod').map((t) => t.url)).toContain(
      'https://muzanella.com/',
    );
    expect(uptimeTargets('dev').map((t) => t.url)).toContain(
      'https://dev-cms.muzanella.com/',
    );
    expect(uptimeTargets('e2e').filter((t) => t.kind === 'site')).toEqual([]);
    expect(tlsHosts('prod')).toHaveLength(5);
  });

  it('cannot be changed from a request: no route takes a URL, body or query', () => {
    const prototype = UptimeController.prototype as unknown as Record<
      string,
      unknown
    >;
    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (name === 'constructor') continue;
      const handler = prototype[name] as object;
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBeDefined();
      expect(Reflect.getMetadata(PATH_METADATA, handler)).not.toContain(':');
      expect(
        Reflect.getMetadata(ROUTE_ARGS_METADATA, UptimeController, name),
      ).toBeUndefined();
    }
  });
});

describe('deploy', () => {
  const reader = {} as LogReaderClient;

  it('flags services whose prod and dev versions differ, with a compare link', () => {
    const service = new DeployService(
      reader,
      MonitorStore.forTesting(new FakeRedis()),
    );
    const rows = service.rows({
      running: [
        container({}),
        container({
          id: 'b'.repeat(64),
          stack: 'enem-landing-dev',
          service: 'enem-landing-dev_enem-landing-api',
          revision: 'bbbbbbb2',
          version: 'dev-bbbbbbb',
        }),
      ],
      stopped: [],
      scannedAt: '',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      service: 'enem-landing-api',
      differs: true,
    });
    expect(rows[0].compareUrl).toBe(
      'https://github.com/muzanella11/enem-landing/compare/aaaaaaa1...bbbbbbb2',
    );
  });

  it('builds links only from a GitHub source label', () => {
    const version = {
      revision: 'aaaaaaa1',
      source: 'https://evil.example/x/y',
    };
    expect(
      compareUrl(
        version as never,
        { ...version, revision: 'bbbbbbb2' } as never,
      ),
    ).toBeNull();
  });

  it('detects rollbacks', () => {
    expect(isRollback({ version: 'v1.2.0' }, { version: 'v1.1.9' })).toBe(true);
    expect(isRollback({ version: 'v1.2.0' }, { version: 'v1.3.0' })).toBe(
      false,
    );
    expect(
      isRollback(
        { version: 'x', imageCreated: '2026-11-23T10:00:00Z' },
        { version: 'y', imageCreated: '2026-11-20T10:00:00Z' },
      ),
    ).toBe(true);
  });

  it('records version changes, not restarts', async () => {
    const service = new DeployService(
      reader,
      MonitorStore.forTesting(new FakeRedis()),
    );
    const list = (c: ContainerInfo) => ({
      running: [c],
      stopped: [],
      scannedAt: '',
    });
    expect(await service.record(list(container({})))).toEqual([]);
    expect(
      await service.record(list(container({ id: 'c'.repeat(64) }))),
    ).toEqual([]);
    const added = await service.record(
      list(
        container({
          id: 'd'.repeat(64),
          version: 'v1.3.0',
          revision: 'ccccccc3',
          imageCreated: '2026-11-24T00:00:00Z',
        }),
      ),
    );
    expect(added).toEqual([
      expect.objectContaining({
        version: 'v1.3.0',
        previousVersion: 'v1.2.0',
        rollback: false,
      }),
    ]);
  });
});

describe('metrics samples', () => {
  it('appends and reads back per-minute samples', async () => {
    const service = new MetricsService(
      {} as LogReaderClient,
      MonitorStore.forTesting(new FakeRedis()),
    );
    const now = Date.parse('2026-11-23T10:00:00Z');
    await service.record(
      {
        time: '',
        cpuPercent: 12.5,
        cpuCount: 2,
        memory: { total: 1, used: 1, available: 0, percent: 70 },
        swap: { total: 1, used: 0, percent: 0 },
        load: [1, 2, 3],
        uptimeSeconds: 1,
        disks: [],
      },
      null,
      now,
    );
    await service.record(null, null, now + 60_000);
    const [cpu] = await service.history(
      ['host:cpu', 'bogus key'],
      24,
      now + 120_000,
    );
    expect(cpu.points).toEqual([[now, 12.5]]);
    expect(parseSeries('1,2;x;3,4;')).toEqual([
      [60_000, 2],
      [180_000, 4],
    ]);
  });
});

describe('redis stats helpers', () => {
  it('parses INFO and groups key prefixes', () => {
    expect(parseInfo('# Memory\r\nused_memory:100\r\nmaxmemory:0\r\n')).toEqual(
      {
        used_memory: '100',
        maxmemory: '0',
      },
    );
    expect(prefixOf('dev:monitor:alerts')).toBe('dev:monitor');
    expect(prefixOf('monitor:alerts')).toBe('monitor');
    expect(prefixOf('blog-posts')).toBe('(tanpa prefix)');
  });
});
