import { open } from 'node:fs/promises';
import type { FaillogRecord, LastlogRecord } from '@enem-landing/shared-types';
import type { PasswdUser } from './passwd.js';
import { readCString } from './utmp.js';

/** `struct lastlog`: int32 ll_time, char ll_line[32], char ll_host[256]. Indexed by uid. */
export const LASTLOG_RECORD_SIZE = 292;
/** `struct faillog`: int16 cnt, int16 max, char line[12], int64 time, int64 locktime. Indexed by uid. */
export const FAILLOG_RECORD_SIZE = 32;

/** Without a passwd file, only the first uids are scanned (the files are sparse). */
const FALLBACK_UID_SCAN = 2000;

const candidateUids = (
  users: PasswdUser[],
  recordCount: number,
): Array<PasswdUser> => {
  if (users.length) return users.filter((user) => user.uid < recordCount);
  return Array.from(
    { length: Math.min(recordCount, FALLBACK_UID_SCAN) },
    (_, uid) => ({ uid, name: '' }),
  );
};

export const parseLastlogRecord = (
  buffer: Buffer,
  uid: number,
  name: string,
): LastlogRecord | null => {
  const seconds = buffer.readInt32LE(0);
  if (seconds === 0) return null;
  return {
    uid,
    user: name || String(uid),
    time: new Date(seconds * 1000).toISOString(),
    line: readCString(buffer, 4, 32),
    host: readCString(buffer, 36, 256),
  };
};

export const parseFaillogRecord = (
  buffer: Buffer,
  uid: number,
  name: string,
): FaillogRecord | null => {
  const failures = buffer.readInt16LE(0);
  const seconds = Number(buffer.readBigInt64LE(16));
  if (failures === 0 && seconds === 0) return null;
  return {
    uid,
    user: name || String(uid),
    failures,
    max: buffer.readInt16LE(2),
    line: readCString(buffer, 4, 12),
    lastFailure: seconds ? new Date(seconds * 1000).toISOString() : null,
  };
};

const readIndexed = async <T>(
  path: string,
  users: PasswdUser[],
  recordSize: number,
  parse: (buffer: Buffer, uid: number, name: string) => T | null,
): Promise<{ entries: T[]; fileSize: number }> => {
  const handle = await open(path, 'r');
  try {
    const { size } = await handle.stat();
    const entries: T[] = [];
    const buffer = Buffer.alloc(recordSize);
    for (const user of candidateUids(users, Math.floor(size / recordSize))) {
      await handle.read(buffer, 0, recordSize, user.uid * recordSize);
      const entry = parse(buffer, user.uid, user.name);
      if (entry) entries.push(entry);
    }
    return { entries, fileSize: size };
  } finally {
    await handle.close();
  }
};

export const readLastlog = (path: string, users: PasswdUser[]) =>
  readIndexed(path, users, LASTLOG_RECORD_SIZE, parseLastlogRecord);

export const readFaillog = (path: string, users: PasswdUser[]) =>
  readIndexed(path, users, FAILLOG_RECORD_SIZE, parseFaillogRecord);
