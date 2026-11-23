import { open } from 'node:fs/promises';
import type {
  LogPage,
  LoginRecord,
  LoginRecordType,
} from '@enem-landing/shared-types';
import { MAX_ENTRIES } from '../limits.js';

/**
 * `struct utmp` on x86_64 glibc (utmp(5)), 384 bytes:
 *   0 ut_type (int16) + 2 padding, 4 ut_pid, 8 ut_line[32], 40 ut_id[4],
 *   44 ut_user[32], 76 ut_host[256], 332 ut_exit, 336 ut_session,
 *   340 ut_tv.tv_sec (int32), 344 ut_tv.tv_usec, 348 ut_addr_v6[4], 364 unused[20]
 */
export const UTMP_RECORD_SIZE = 384;

const TYPES: LoginRecordType[] = [
  'EMPTY',
  'RUN_LVL',
  'BOOT_TIME',
  'NEW_TIME',
  'OLD_TIME',
  'INIT_PROCESS',
  'LOGIN_PROCESS',
  'USER_PROCESS',
  'DEAD_PROCESS',
  'ACCOUNTING',
];

export const readCString = (
  buffer: Buffer,
  start: number,
  length: number,
): string => {
  const slice = buffer.subarray(start, start + length);
  const end = slice.indexOf(0);
  // Control characters (attacker-chosen usernames in btmp) become `?`.
  return Array.from(
    slice.subarray(0, end === -1 ? slice.length : end).toString('utf8'),
    (char) => {
      const code = char.charCodeAt(0);
      return code < 0x20 || code === 0x7f ? '?' : char;
    },
  ).join('');
};

const formatAddress = (buffer: Buffer, start: number): string => {
  const words = [0, 1, 2, 3].map((index) =>
    buffer.readUInt32LE(start + index * 4),
  );
  if (words.every((word) => word === 0)) return '';
  if (words[1] === 0 && words[2] === 0 && words[3] === 0) {
    return Array.from(buffer.subarray(start, start + 4)).join('.');
  }
  const groups: string[] = [];
  for (let index = 0; index < 16; index += 2) {
    groups.push(buffer.readUInt16BE(start + index).toString(16));
  }
  return groups.join(':');
};

export const parseUtmpRecord = (buffer: Buffer, offset = 0): LoginRecord => {
  const type = buffer.readInt16LE(offset);
  const seconds = buffer.readInt32LE(offset + 340);
  return {
    type: TYPES[type] ?? 'UNKNOWN',
    pid: buffer.readInt32LE(offset + 4),
    line: readCString(buffer, offset + 8, 32),
    user: readCString(buffer, offset + 44, 32),
    host: readCString(buffer, offset + 76, 256),
    ip: formatAddress(buffer, offset + 348),
    time: new Date(seconds * 1000).toISOString(),
  };
};

export interface UtmpPageOptions {
  /** Exclusive record index. Defaults to the record count. */
  before?: number;
  limit: number;
  match: (record: LoginRecord) => boolean;
  deadline: number;
  maxScanRecords?: number;
}

const CHUNK_RECORDS = 256;

/** Reads `btmp`/`wtmp` newest record first, a chunk of records at a time. */
export const readUtmpPage = async (
  path: string,
  options: UtmpPageOptions,
): Promise<LogPage<LoginRecord>> => {
  const handle = await open(path, 'r');
  try {
    const { size } = await handle.stat();
    const total = Math.floor(size / UTMP_RECORD_SIZE);
    const end = Math.min(options.before ?? total, total);
    const limit = Math.min(options.limit, MAX_ENTRIES);
    const maxScan = options.maxScanRecords ?? 300_000;
    const entries: LoginRecord[] = [];
    let index = end;
    let truncated = false;

    while (index > 0 && entries.length < limit) {
      if (end - index >= maxScan || Date.now() > options.deadline) {
        truncated = true;
        break;
      }
      const first = Math.max(0, index - CHUNK_RECORDS);
      const count = index - first;
      const buffer = Buffer.alloc(count * UTMP_RECORD_SIZE);
      await handle.read(buffer, 0, buffer.length, first * UTMP_RECORD_SIZE);
      for (
        let record = count - 1;
        record >= 0 && entries.length < limit;
        record -= 1
      ) {
        index = first + record;
        const parsed = parseUtmpRecord(buffer, record * UTMP_RECORD_SIZE);
        if (parsed.type !== 'EMPTY' && options.match(parsed))
          entries.push(parsed);
      }
      if (entries.length < limit) index = first;
    }

    return {
      entries: entries.reverse(),
      nextBefore: index > 0 ? index : null,
      truncated,
      fileSize: size,
    };
  } finally {
    await handle.close();
  }
};

/** Records newer than `sinceMs`, counted from the end (summary card). */
export const countUtmpSince = async (
  path: string,
  sinceMs: number,
  deadline: number,
): Promise<number> => {
  const handle = await open(path, 'r');
  try {
    const { size } = await handle.stat();
    let index = Math.floor(size / UTMP_RECORD_SIZE);
    let count = 0;
    let scanned = 0;
    while (index > 0 && scanned < 500_000 && Date.now() <= deadline) {
      const first = Math.max(0, index - CHUNK_RECORDS * 4);
      const records = index - first;
      const buffer = Buffer.alloc(records * UTMP_RECORD_SIZE);
      await handle.read(buffer, 0, buffer.length, first * UTMP_RECORD_SIZE);
      for (let record = records - 1; record >= 0; record -= 1) {
        const offset = record * UTMP_RECORD_SIZE;
        if (buffer.readInt16LE(offset) === 0) continue;
        if (buffer.readInt32LE(offset + 340) * 1000 < sinceMs) return count;
        count += 1;
      }
      scanned += records;
      index = first;
    }
    return count;
  } finally {
    await handle.close();
  }
};
