import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { utmpRecord } from '../testing/fixtures.js';
import {
  FAILLOG_RECORD_SIZE,
  LASTLOG_RECORD_SIZE,
  parseFaillogRecord,
  readLastlog,
} from './lastlog.js';
import { parsePasswd } from './passwd.js';
import { tailFile } from './tail-reader.js';
import { parseUtmpRecord } from './utmp.js';

const dir = mkdtempSync(join(tmpdir(), 'readers-'));
const deadline = () => Date.now() + 5000;
const keep = (line: string) => line;

describe('tail reader', () => {
  const lines = Array.from({ length: 5000 }, (_, index) => `line ${index}`);
  const content = lines.join('\n') + '\n';
  const plain = join(dir, 'big.log');
  const gz = join(dir, 'big.log.1.gz');
  writeFileSync(plain, content);
  writeFileSync(gz, gzipSync(content));

  it.each([
    ['plain', plain, false],
    ['gzip', gz, true],
  ] as const)(
    'pages backwards through a %s file',
    async (_label, path, compressed) => {
      const first = await tailFile(path, compressed, {
        limit: 3,
        transform: keep,
        deadline: deadline(),
      });
      expect(first.entries).toEqual(['line 4997', 'line 4998', 'line 4999']);
      const second = await tailFile(path, compressed, {
        limit: 3,
        before: first.nextBefore ?? undefined,
        transform: keep,
        deadline: deadline(),
      });
      expect(second.entries).toEqual(['line 4994', 'line 4995', 'line 4996']);

      let before: number | undefined;
      let total = 0;
      for (;;) {
        const page = await tailFile(path, compressed, {
          limit: 1000,
          before,
          transform: keep,
          deadline: deadline(),
        });
        total += page.entries.length;
        if (page.nextBefore === null) break;
        before = page.nextBefore;
      }
      expect(total).toBe(5000);
    },
  );

  it('stops scanning at the scan budget and returns a cursor', async () => {
    const page = await tailFile(plain, false, {
      limit: 10,
      transform: () => null,
      deadline: deadline(),
      maxScanBytes: 1000,
    });
    expect(page.truncated).toBe(true);
    expect(page.entries).toEqual([]);
    expect(page.nextBefore).toBeGreaterThan(0);
  });

  it('handles a file without a trailing newline', async () => {
    const path = join(dir, 'no-newline.log');
    writeFileSync(path, 'a\nb');
    expect(
      (
        await tailFile(path, false, {
          limit: 10,
          transform: keep,
          deadline: deadline(),
        })
      ).entries,
    ).toEqual(['a', 'b']);
  });
});

describe('binary records', () => {
  it('parses an IPv4 utmp record', () => {
    const record = parseUtmpRecord(
      utmpRecord({
        type: 7,
        user: 'muzanella',
        host: '10.0.0.1',
        ip: [10, 0, 0, 1],
        seconds: 1795000000,
      }),
    );
    expect(record).toMatchObject({
      type: 'USER_PROCESS',
      user: 'muzanella',
      ip: '10.0.0.1',
      line: 'ssh:notty',
      pid: 1234,
    });
    expect(record.time).toBe(new Date(1795000000 * 1000).toISOString());
  });

  it('parses an IPv6 utmp record', () => {
    const ip = [0x20, 0x01, 0x0d, 0xb8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
    expect(
      parseUtmpRecord(
        utmpRecord({ type: 6, user: 'x', host: '', ip, seconds: 1 }),
      ).ip,
    ).toBe('2001:db8:0:0:0:0:0:1');
  });

  it('reads lastlog entries only for users that logged in', async () => {
    const buffer = Buffer.alloc(LASTLOG_RECORD_SIZE * 1001);
    buffer.writeInt32LE(1795000000, LASTLOG_RECORD_SIZE * 1000);
    buffer.write('pts/0', LASTLOG_RECORD_SIZE * 1000 + 4);
    buffer.write('203.0.113.5', LASTLOG_RECORD_SIZE * 1000 + 36);
    const path = join(dir, 'lastlog');
    writeFileSync(path, buffer);
    const users = parsePasswd(
      'root:x:0:0:root:/root:/bin/bash\nmuzanella:x:1000:1000::/home/muzanella:/bin/bash\n',
    );
    const { entries } = await readLastlog(path, users);
    expect(entries).toEqual([
      {
        uid: 1000,
        user: 'muzanella',
        line: 'pts/0',
        host: '203.0.113.5',
        time: new Date(1795000000 * 1000).toISOString(),
      },
    ]);
  });

  it('parses a faillog record', () => {
    const buffer = Buffer.alloc(FAILLOG_RECORD_SIZE);
    buffer.writeInt16LE(3, 0);
    buffer.writeBigInt64LE(1795000000n, 16);
    expect(parseFaillogRecord(buffer, 0, 'root')).toMatchObject({
      user: 'root',
      failures: 3,
    });
    expect(
      parseFaillogRecord(Buffer.alloc(FAILLOG_RECORD_SIZE), 1, 'x'),
    ).toBeNull();
  });
});
