import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LogReaderClient } from './log-reader.client.js';
import { parseSlowlog } from './redis-slowlog.js';

const TOKEN = 't'.repeat(40);

describe('LogReaderClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env['LOG_READER_TOKEN'];
    delete process.env['LOGS_ENABLED'];
  });

  it('is disabled without a token or with LOGS_ENABLED=false', async () => {
    await expect(new LogReaderClient().get('/sources')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    process.env['LOG_READER_TOKEN'] = TOKEN;
    process.env['LOGS_ENABLED'] = 'false';
    await expect(new LogReaderClient().get('/sources')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('sends the token and only non-empty query values', async () => {
    process.env['LOG_READER_TOKEN'] = TOKEN;
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: 'auth' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      new LogReaderClient().get('/sources/auth/entries', {
        limit: '10',
        q: '',
        before: undefined,
      }),
    ).resolves.toEqual([{ id: 'auth' }]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(url.toString()).toBe(
      'http://localhost:3004/sources/auth/entries?limit=10',
    );
    expect((init.headers as Record<string, string>)['X-Log-Reader-Token']).toBe(
      TOKEN,
    );
  });

  it('maps a reader 401 (token mismatch) to 502 and keeps other statuses', async () => {
    process.env['LOG_READER_TOKEN'] = TOKEN;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'bad token' }), {
            status: 401,
          }),
      ),
    );
    await expect(new LogReaderClient().get('/sources')).rejects.toMatchObject({
      status: 502,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'Unknown log source' }), {
            status: 404,
          }),
      ),
    );
    const error = (await new LogReaderClient()
      .get('/sources/x/entries')
      .catch((e: unknown) => e)) as HttpException;
    expect(error.getStatus()).toBe(404);
    expect(error.message).toBe('Unknown log source');
  });
});

describe('parseSlowlog', () => {
  it('maps rows and hides AUTH arguments', () => {
    expect(
      parseSlowlog([
        [7, 1795000000, 15000, ['KEYS', 'cache:*'], '10.0.1.5:4242', 'api'],
        [6, 1795000000, 12000, ['AUTH', 'secret-password'], '10.0.1.6:1', ''],
      ]),
    ).toEqual([
      {
        id: 7,
        time: new Date(1795000000000).toISOString(),
        durationMicros: 15000,
        command: 'KEYS cache:*',
        client: '10.0.1.5:4242',
        clientName: 'api',
      },
      {
        id: 6,
        time: new Date(1795000000000).toISOString(),
        durationMicros: 12000,
        command: 'AUTH ***',
        client: '10.0.1.6:1',
        clientName: '',
      },
    ]);
  });
});
