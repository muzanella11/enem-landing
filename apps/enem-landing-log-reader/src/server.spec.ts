import type { AddressInfo } from 'node:net';
import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createReaderServer, TOKEN_HEADER } from './server.js';
import {
  CONTAINER_ID,
  createHost,
  STOPPED_ID,
  TOKEN,
} from './testing/fixtures.js';

describe('log-reader server', () => {
  let server: Server;
  let base: string;
  let hostRoot: string;

  beforeAll(async () => {
    const host = createHost();
    hostRoot = host.root;
    server = createReaderServer(host.config);
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const get = (path: string, token: string | null = TOKEN) =>
    fetch(`${base}${path}`, {
      headers: token ? { [TOKEN_HEADER]: token } : {},
    });
  // Loosely typed on purpose: the assertions below check the shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = async (path: string): Promise<any> => (await get(path)).json();

  it('serves /health without a token', async () => {
    expect((await get('/health', null)).status).toBe(200);
    expect((await fetch(`${base}/health`, { method: 'HEAD' })).status).toBe(
      200,
    );
  });

  it('rejects requests without the right token', async () => {
    expect((await get('/sources', null)).status).toBe(401);
    expect((await get('/sources', 'b'.repeat(40))).status).toBe(401);
  });

  it('rejects anything but GET', async () => {
    const response = await fetch(`${base}/sources`, {
      method: 'POST',
      headers: { [TOKEN_HEADER]: TOKEN },
    });
    expect(response.status).toBe(405);
  });

  it('lists sources without leaking host paths', async () => {
    const body = await (await get('/sources')).text();
    expect(body).toContain('"id":"auth"');
    expect(body).not.toContain(hostRoot);
  });

  it.each([
    '/sources/..%2F..%2Fsecret.txt/entries',
    '/sources/%2e%2e/entries',
    '/sources/../../secret.txt/entries',
    '/sources//etc/passwd/entries',
    '/sources/unknown/entries',
    '/sources/journal/entries',
  ])('rejects traversal or unknown source %s', async (path) => {
    const response = await get(path);
    expect([400, 404]).toContain(response.status);
    expect(await response.text()).not.toContain('top secret');
  });

  it('rejects an out-of-range file index and invalid params', async () => {
    expect((await get('/sources/auth/entries?file=7')).status).toBe(404);
    expect((await get('/sources/auth/entries?file=../x')).status).toBe(400);
    expect((await get('/sources/auth/entries?limit=5000')).status).toBe(400);
    expect((await get('/sources/auth/entries?before=-1')).status).toBe(400);
  });

  it('refuses a rotation that is a symlink out of the log dir', async () => {
    symlinkSync(
      join(hostRoot, 'secret.txt'),
      join(hostRoot, 'var/log/auth.log.2'),
    );
    const sources = (await json('/sources')) as Array<{
      id: string;
      files: Array<{ name: string }>;
    }>;
    expect(
      sources
        .find((source) => source.id === 'auth')
        ?.files.map((file) => file.name),
    ).toEqual(['auth.log', 'auth.log.1']);
  });

  it('reads the tail of a text source with search', async () => {
    const body = await json('/sources/auth/entries?limit=2');
    expect(body.entries).toEqual(['Failed password for root', 'line three']);
    expect(body.nextBefore).toBe(9);
    const older = await json(
      `/sources/auth/entries?limit=2&before=${body.nextBefore}`,
    );
    expect(older.entries).toEqual(['line one']);
    expect(older.nextBefore).toBeNull();
    const search = await json('/sources/auth/entries?q=FAILED');
    expect(search.entries).toEqual(['Failed password for root']);
    expect((await json('/sources/auth/entries?file=1')).entries).toEqual([
      'older line',
    ]);
  });

  it('reports unsupported .xz rotations', async () => {
    expect((await get('/sources/apt-eipp/entries')).status).toBe(415);
  });

  it('parses btmp records newest last', async () => {
    const body = await json('/sources/btmp/entries');
    expect(
      body.entries.map((entry: { user: string; ip: string }) => [
        entry.user,
        entry.ip,
      ]),
    ).toEqual([
      ['admin', '203.0.113.9'],
      ['root', '198.51.100.7'],
    ]);
  });

  it('parses the MySQL slow log into entries', async () => {
    const body = await json('/sources/mysql-slow/entries');
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0]).toMatchObject({
      user: 'enem_prod',
      host: '10.0.1.5',
      queryTime: 2.5,
      rowsExamined: 100000,
      query: 'use enem_landing_api;\nSELECT * FROM tracking_sessions;',
    });
    expect(body.entries[1]).toMatchObject({
      user: 'enem_dev',
      host: 'localhost',
      query: 'DELETE FROM blog_posts\n  WHERE id = 1;',
    });
  });

  it('lists running and stopped containers', async () => {
    const body = await json('/containers');
    expect(body.running).toHaveLength(1);
    expect(body.running[0]).toMatchObject({
      id: CONTAINER_ID,
      category: 'apps-prod',
      restartCount: 1,
      recentCrash: true,
    });
    expect(body.stopped[0]).toMatchObject({
      id: STOPPED_ID,
      crashed: true,
      oomKilled: true,
      exitCode: 137,
    });
    expect(JSON.stringify(body)).not.toContain(hostRoot);
  });

  it('reads container logs with a stream filter', async () => {
    const all = await json(`/containers/${CONTAINER_ID}/entries`);
    expect(
      all.entries.map((line: { message: string }) => line.message),
    ).toEqual(['booting', 'Error: boom']);
    const stderr = await json(
      `/containers/${CONTAINER_ID}/entries?stream=stderr`,
    );
    expect(stderr.entries).toEqual([
      {
        time: '2026-11-23T10:00:01Z',
        stream: 'stderr',
        message: 'Error: boom',
      },
    ]);
  });

  it('rejects container ids that are not from the scan', async () => {
    expect((await get(`/containers/${'e'.repeat(64)}/entries`)).status).toBe(
      404,
    );
    expect((await get('/containers/../../secret.txt/entries')).status).toBe(
      404,
    );
    expect(
      (await get(`/containers/${CONTAINER_ID.toUpperCase()}/entries`)).status,
    ).toBe(404);
  });

  it('answers 501 when journalctl is missing', async () => {
    expect((await get('/journal')).status).toBe(501);
  });

  it('builds a summary with failed logins in the last 24h', async () => {
    const body = await json('/summary');
    expect(body.failedLogins24h).toBe(1);
    expect(body.oomEvents).toBeNull();
  });
});
