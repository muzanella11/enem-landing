import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { appendFileSync, renameSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { backupRunsFromJournal } from './backup/status.js';
import {
  cpuPercentBetween,
  parseCpuLine,
  parseMeminfo,
} from './metrics/host.js';
import { decodeMysqlName } from './mysql/sizes.js';
import { fingerprint } from './mysql/slow-patterns.js';
import { parseLineTime } from './readers/line-time.js';
import { seekTime } from './readers/seek.js';
import { mergeLogins, parseAcceptedLine } from './security/summary.js';
import { createReaderServer, TOKEN_HEADER } from './server.js';
import { CONTAINER_ID, createHost, TOKEN } from './testing/fixtures.js';

describe('pure helpers', () => {
  it('computes CPU usage between two /proc/stat samples', () => {
    const a = parseCpuLine('cpu  100 0 100 700 100 0 0 0 0 0\n');
    const b = parseCpuLine('cpu  150 0 150 750 100 0 0 0 0 0\n');
    expect(a && b && cpuPercentBetween(a, b)).toBe(66.7);
  });

  it('reads /proc/meminfo in bytes', () => {
    expect(parseMeminfo('MemTotal: 2 kB\nHugePages_Total: 0\n')).toEqual({
      MemTotal: 2048,
      HugePages_Total: 0,
    });
  });

  it('parses RFC 3339 and classic syslog times', () => {
    expect(parseLineTime('2026-11-23T10:00:00.5+07:00 vps sshd[1]: x')).toBe(
      Date.parse('2026-11-23T03:00:00.500Z'),
    );
    const now = Date.parse('2026-11-23T12:00:00Z');
    expect(parseLineTime('Nov 23 10:00:00 vps cron[1]: x', now)).toBe(
      Date.parse('2026-11-23T10:00:00Z'),
    );
    // December line read in January belongs to last year.
    expect(
      parseLineTime(
        'Dec 31 23:59:59 vps x',
        Date.parse('2027-01-01T00:10:00Z'),
      ),
    ).toBe(Date.parse('2026-12-31T23:59:59Z'));
    expect(parseLineTime('no time here')).toBeNull();
  });

  it('fingerprints slow queries into patterns', () => {
    expect(
      fingerprint(
        "use enem_landing_api;\nSELECT * FROM t1 WHERE id = 42 AND name = 'x''y' AND a IN (1, 2, 3);",
      ),
    ).toBe('SELECT * FROM t1 WHERE id = ? AND name = ? AND a IN (?+)');
    expect(fingerprint('DELETE FROM blog_posts\n  WHERE id = 1;')).toBe(
      'DELETE FROM blog_posts WHERE id = ?',
    );
  });

  it('decodes MySQL file name encoding', () => {
    expect(decodeMysqlName('my@002ddb')).toBe('my-db');
  });

  it('parses accepted SSH logins with their method', () => {
    expect(
      parseAcceptedLine(
        '2026-11-23T10:00:00Z vps sshd[9]: Accepted publickey for muzanella from 203.0.113.5 port 1 ssh2: ED25519 SHA256:x',
      ),
    ).toMatchObject({
      user: 'muzanella',
      ip: '203.0.113.5',
      method: 'publickey',
    });
    expect(
      parseAcceptedLine(
        '2026-11-23T10:00:00Z vps sshd[9]: Failed password for root',
      ),
    ).toBeNull();
  });

  it('merges wtmp records that match an auth.log login', () => {
    const merged = mergeLogins(
      [
        {
          time: '2026-11-23T10:00:00Z',
          user: 'a',
          ip: '1',
          method: 'publickey',
          source: 'auth.log',
        },
      ],
      [
        {
          time: '2026-11-23T10:00:05Z',
          user: 'a',
          ip: '1',
          method: 'other',
          source: 'wtmp',
        },
        {
          time: '2026-11-23T11:00:00Z',
          user: 'b',
          ip: '2',
          method: 'other',
          source: 'wtmp',
        },
      ],
    );
    expect(merged.map((login) => login.user)).toEqual(['b', 'a']);
  });

  it('turns mysql-backup journal lines into runs', () => {
    const entry = (time: string, message: string) => ({
      cursor: '',
      time,
      priority: 6,
      unit: 'mysql-backup.service',
      identifier: '',
      pid: '',
      message,
    });
    const runs = backupRunsFromJournal([
      entry('2026-11-21T19:00:30Z', 'Backup 20261121T190000Z done'),
      entry(
        '2026-11-22T19:00:10Z',
        'MySQL backup FAILED on vps (line 3, exit 1). Check: journalctl',
      ),
      entry(
        '2026-11-22T19:00:11Z',
        "mysql-backup.service: Failed with result 'exit-code'.",
      ),
    ]);
    expect(runs).toHaveLength(2);
    expect(runs[0]).toMatchObject({ ok: false });
    expect(runs[0].message).toContain('MySQL backup FAILED');
    expect(runs[1]).toMatchObject({ ok: true });
  });
});

describe('seekTime', () => {
  it('finds the offset of the first line after a time', async () => {
    const { root } = createHost();
    const path = join(root, 'seek.log');
    const lines: string[] = [];
    for (let minute = 0; minute < 3000; minute += 1) {
      const time = new Date(Date.UTC(2026, 10, 23, 0, 0) + minute * 60_000);
      lines.push(`${time.toISOString()} line ${minute} ${'x'.repeat(40)}`);
    }
    writeFileSync(path, lines.join('\n') + '\n');
    const target = Date.UTC(2026, 10, 23, 10, 0, 30);
    const { offset } = await seekTime(path, target, (line) =>
      parseLineTime(line),
    );
    const content = lines.join('\n') + '\n';
    expect(content.slice(offset).startsWith(lines[601])).toBe(true);
    expect(
      (await seekTime(path, 0, (line) => parseLineTime(line))).offset,
    ).toBe(0);
    expect(
      (
        await seekTime(path, Date.UTC(2030, 0, 1), (line) =>
          parseLineTime(line),
        )
      ).offset,
    ).toBe(Buffer.byteLength(content));
  });
});

describe('log-reader feature routes', () => {
  let server: Server;
  let base: string;
  let hostRoot: string;

  beforeAll(async () => {
    const host = createHost();
    hostRoot = host.root;
    appendFileSync(
      join(host.root, 'var/log/auth.log'),
      `${new Date(Date.now() - 600_000).toISOString()} vps sshd[42]: Accepted password for root from 192.0.2.10 port 5555 ssh2\n`,
    );
    // The fixture lines are dated 2026-11-23T10:00Z; a file last written
    // before the window is skipped, so make it look written after it.
    const later = new Date('2030-01-01T00:00:00Z');
    utimesSync(
      join(host.config.containersDir, CONTAINER_ID, `${CONTAINER_ID}-json.log`),
      later,
      later,
    );
    server = createReaderServer(host.config);
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = async (path: string): Promise<any> => {
    const response = await fetch(`${base}${path}`, {
      headers: { [TOKEN_HEADER]: TOKEN },
    });
    expect(response.status, path).toBe(200);
    return response.json();
  };

  it('needs the token on the new routes too', async () => {
    for (const path of [
      '/metrics/host',
      '/security/summary',
      '/timeline?around=2026-11-23T10:00:00Z',
    ]) {
      expect((await fetch(`${base}${path}`)).status).toBe(401);
    }
  });

  it('reads host metrics from /proc', async () => {
    const host = await json('/metrics/host');
    expect(host.memory.total).toBe(3_800_000 * 1024);
    expect(host.memory.percent).toBe(50);
    expect(host.swap.percent).toBe(25);
    expect(host.load).toEqual([0.5, 1.25, 0.75]);
    expect(host.cpuCount).toBe(2);
    expect(host.uptimeSeconds).toBe(86401);
    expect(host.disks.length).toBeGreaterThan(0);
  });

  it('reads container memory from cgroup v2', async () => {
    const list = await json('/metrics/containers');
    expect(list.containers).toHaveLength(1);
    expect(list.containers[0]).toMatchObject({
      id: CONTAINER_ID,
      memoryPercent: 75,
      oomKills: 1,
      service: 'enem-landing_enem-landing-api',
    });
    expect(list.totalLimits).toBe(200 * 1024 * 1024);
  });

  it('summarizes failed and successful logins', async () => {
    const summary = await json('/security/summary?hours=24');
    expect(summary.failedTotal).toBe(1);
    expect(summary.topIps[0]).toMatchObject({
      ip: '198.51.100.7',
      topUser: 'root',
    });
    expect(summary.topUsers[0]).toEqual({ user: 'root', count: 1 });
    expect(
      summary.logins.map((login: { user: string }) => login.user).sort(),
    ).toEqual(['muzanella', 'root']);
    const week = await json('/security/summary?hours=168');
    expect(week.failedTotal).toBe(2);
    expect((await json('/security/failed-count?minutes=60')).count).toBe(1);
    expect(
      (
        await fetch(`${base}/security/summary?hours=999`, {
          headers: { [TOKEN_HEADER]: TOKEN },
        })
      ).status,
    ).toBe(400);
  });

  it('lists MySQL sizes without system schemas', async () => {
    const sizes = await json('/mysql/sizes');
    expect(sizes.databases).toEqual([
      { name: 'enem_landing_api', bytes: 12288, tables: 2 },
    ]);
    expect(sizes.topTables[0]).toMatchObject({ table: 'tracking_sessions' });
    expect(sizes.totalBytes).toBe(12288 + 1024 + 2048);
  });

  it('groups the slow log by pattern', async () => {
    const result = await json('/mysql/slow-patterns');
    expect(result.entries).toBe(2);
    expect(result.patterns[0].pattern).toBe('SELECT * FROM tracking_sessions');
  });

  it('exposes OCI labels of containers', async () => {
    const list = await json('/containers');
    expect(list.running[0]).toMatchObject({
      image: 'ghcr.io/muzanella11/enem-landing-api:prod',
      version: 'v1.2.3',
      revision: 'abcdef1234567890',
    });
  });

  it('builds a timeline around a time', async () => {
    const page = await json('/timeline?around=2026-11-23T10:00:00Z&window=4');
    expect(page.lines.map((line: { message: string }) => line.message)).toEqual(
      ['booting', 'Error: boom'],
    );
    expect(page.lines[0].service).toBe('enem-landing_enem-landing-api');
    const none = await json(
      '/timeline?around=2026-11-23T10:00:00Z&window=4&categories=db',
    );
    expect(none.lines).toEqual([]);
  });

  it('seeks a container log to a time', async () => {
    const result = await json(
      `/containers/${CONTAINER_ID}/seek?time=2026-11-23T10:00:00.500Z`,
    );
    expect(result.before).toBeGreaterThan(0);
    expect(result.before).toBeLessThan(result.fileSize);
  });

  it('streams new lines and follows rotation', async () => {
    const path = join(hostRoot, 'var/log/syslog');
    writeFileSync(path, 'old line\n');
    const controller = new AbortController();
    const response = await fetch(`${base}/sources/syslog/follow`, {
      headers: { [TOKEN_HEADER]: TOKEN },
      signal: controller.signal,
    });
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let received = '';
    const readUntil = async (needle: string) => {
      const until = Date.now() + 5000;
      while (!received.includes(needle) && Date.now() < until) {
        const { value, done } = await reader.read();
        if (done) break;
        received += decoder.decode(value);
      }
    };
    await readUntil(': connected');
    appendFileSync(path, 'fresh line\n');
    await readUntil('fresh line');
    expect(received).toContain('"entries":["fresh line"]');
    expect(received).not.toContain('old line');

    renameSync(path, `${path}.1`);
    writeFileSync(path, 'after rotation\n');
    await readUntil('after rotation');
    expect(received).toContain('"rotated":true');
    controller.abort();
  }, 15_000);
});
