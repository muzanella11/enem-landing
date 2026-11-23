import { open } from 'node:fs/promises';
import type {
  SecurityIpStat,
  SecuritySummary,
  SuccessfulLogin,
} from '@enem-landing/shared-types';
import { parseLineTime } from '../readers/line-time.js';
import { tailFile } from '../readers/tail-reader.js';
import { parseUtmpRecord, UTMP_RECORD_SIZE } from '../readers/utmp.js';

const HOUR_MS = 60 * 60 * 1000;
const CHUNK_RECORDS = 1024;
/** Distinct IPs/users kept while aggregating, so a huge btmp can't blow the 96M limit. */
const MAX_DISTINCT = 50_000;
const TOP = 50;

interface IpAccumulator {
  count: number;
  first: number;
  last: number;
  users: Map<string, number>;
}

export interface FailedLoginAggregate {
  failedTotal: number;
  perHour: Map<number, number>;
  ips: Map<string, IpAccumulator>;
  users: Map<string, number>;
  truncated: boolean;
}

const hourOf = (ms: number): number => Math.floor(ms / HOUR_MS) * HOUR_MS;

/**
 * Reads `btmp` from the end (newest record first) down to `sinceMs` and
 * aggregates it in one pass: per hour, per IP (with the user it tried
 * most) and per username. Bounded by `deadline` and `MAX_DISTINCT`.
 */
export const aggregateFailedLogins = async (
  path: string,
  sinceMs: number,
  deadline: number,
): Promise<FailedLoginAggregate> => {
  const result: FailedLoginAggregate = {
    failedTotal: 0,
    perHour: new Map(),
    ips: new Map(),
    users: new Map(),
    truncated: false,
  };
  const handle = await open(path, 'r');
  try {
    const { size } = await handle.stat();
    let index = Math.floor(size / UTMP_RECORD_SIZE);
    const buffer = Buffer.alloc(CHUNK_RECORDS * UTMP_RECORD_SIZE);
    outer: while (index > 0) {
      if (Date.now() > deadline) {
        result.truncated = true;
        break;
      }
      const first = Math.max(0, index - CHUNK_RECORDS);
      const count = index - first;
      await handle.read(
        buffer,
        0,
        count * UTMP_RECORD_SIZE,
        first * UTMP_RECORD_SIZE,
      );
      for (let record = count - 1; record >= 0; record -= 1) {
        const offset = record * UTMP_RECORD_SIZE;
        if (buffer.readInt16LE(offset) === 0) continue;
        const time = buffer.readInt32LE(offset + 340) * 1000;
        if (time < sinceMs) break outer;
        const parsed = parseUtmpRecord(buffer, offset);
        const ip = parsed.ip || parsed.host || '?';
        const user = parsed.user || '?';
        result.failedTotal += 1;
        const hour = hourOf(time);
        result.perHour.set(hour, (result.perHour.get(hour) ?? 0) + 1);

        let entry = result.ips.get(ip);
        if (!entry && result.ips.size < MAX_DISTINCT) {
          entry = { count: 0, first: time, last: time, users: new Map() };
          result.ips.set(ip, entry);
        }
        if (entry) {
          entry.count += 1;
          entry.first = Math.min(entry.first, time);
          entry.last = Math.max(entry.last, time);
          if (entry.users.size < 50 || entry.users.has(user))
            entry.users.set(user, (entry.users.get(user) ?? 0) + 1);
        } else {
          result.truncated = true;
        }
        if (result.users.has(user) || result.users.size < MAX_DISTINCT)
          result.users.set(user, (result.users.get(user) ?? 0) + 1);
      }
      index = first;
    }
  } finally {
    await handle.close();
  }
  return result;
};

const ACCEPTED = /sshd\[\d+\]: Accepted (\S+) for (\S+) from (\S+) port \d+/;

/** `Accepted publickey for root from 1.2.3.4 port 5 ssh2` -> login. */
export const parseAcceptedLine = (
  line: string,
  now = Date.now(),
): SuccessfulLogin | null => {
  const match = ACCEPTED.exec(line);
  if (!match) return null;
  const time = parseLineTime(line, now);
  if (time === null) return null;
  const method =
    match[1] === 'publickey'
      ? 'publickey'
      : match[1] === 'password' || match[1].startsWith('keyboard-interactive')
        ? 'password'
        : 'other';
  return {
    time: new Date(time).toISOString(),
    user: match[2],
    ip: match[3],
    method,
    source: 'auth.log',
  };
};

/** Successful SSH logins from `auth.log` (with method) newer than `sinceMs`. */
export const readAcceptedLogins = async (
  path: string,
  compressed: boolean,
  sinceMs: number,
  deadline: number,
): Promise<SuccessfulLogin[]> => {
  const now = Date.now();
  const page = await tailFile(path, compressed, {
    limit: 1000,
    deadline,
    stop: (line) => {
      const time = parseLineTime(line, now);
      return time !== null && time < sinceMs;
    },
    transform: (line) => parseAcceptedLine(line, now),
  });
  return page.entries;
};

/** `USER_PROCESS` records of `wtmp` newer than `sinceMs` (no method there). */
export const readWtmpLogins = async (
  path: string,
  sinceMs: number,
): Promise<SuccessfulLogin[]> => {
  const handle = await open(path, 'r');
  const logins: SuccessfulLogin[] = [];
  try {
    const { size } = await handle.stat();
    let index = Math.floor(size / UTMP_RECORD_SIZE);
    const buffer = Buffer.alloc(256 * UTMP_RECORD_SIZE);
    outer: while (index > 0 && logins.length < 1000) {
      const first = Math.max(0, index - 256);
      const count = index - first;
      await handle.read(
        buffer,
        0,
        count * UTMP_RECORD_SIZE,
        first * UTMP_RECORD_SIZE,
      );
      for (let record = count - 1; record >= 0; record -= 1) {
        const parsed = parseUtmpRecord(buffer, record * UTMP_RECORD_SIZE);
        if (parsed.type === 'EMPTY') continue;
        if (Date.parse(parsed.time) < sinceMs) break outer;
        if (parsed.type !== 'USER_PROCESS') continue;
        logins.push({
          time: parsed.time,
          user: parsed.user,
          ip: parsed.ip || parsed.host,
          method: 'other',
          source: 'wtmp',
        });
      }
      index = first;
    }
  } finally {
    await handle.close();
  }
  return logins;
};

/**
 * auth.log knows the method, wtmp also covers logins auth.log may have
 * rotated away. A wtmp record within 10 s of an auth.log line for the
 * same user and IP is the same login.
 */
export const mergeLogins = (
  fromAuth: SuccessfulLogin[],
  fromWtmp: SuccessfulLogin[],
): SuccessfulLogin[] => {
  const merged = [...fromAuth];
  for (const login of fromWtmp) {
    const duplicate = fromAuth.some(
      (other) =>
        other.user === login.user &&
        other.ip === login.ip &&
        Math.abs(Date.parse(other.time) - Date.parse(login.time)) <= 10_000,
    );
    if (!duplicate) merged.push(login);
  }
  return merged.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
};

const topUser = (users: Map<string, number>): string => {
  let best = '';
  let bestCount = -1;
  for (const [user, count] of users) {
    if (count > bestCount) {
      best = user;
      bestCount = count;
    }
  }
  return best;
};

export const buildSummary = (
  hours: number,
  sinceMs: number,
  now: number,
  failed: FailedLoginAggregate | null,
  logins: SuccessfulLogin[],
): SecuritySummary => {
  const perHour: Array<[number, number]> = [];
  for (let hour = hourOf(sinceMs); hour <= now; hour += HOUR_MS) {
    perHour.push([hour, failed?.perHour.get(hour) ?? 0]);
  }
  const topIps: SecurityIpStat[] = [...(failed?.ips ?? new Map()).entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP)
    .map(([ip, entry]) => ({
      ip,
      count: entry.count,
      firstSeen: new Date(entry.first).toISOString(),
      lastSeen: new Date(entry.last).toISOString(),
      topUser: topUser(entry.users),
    }));
  const topUsers = [...(failed?.users ?? new Map()).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP)
    .map(([user, count]) => ({ user, count }));
  return {
    hours,
    failedTotal: failed?.failedTotal ?? 0,
    uniqueIps: failed?.ips.size ?? 0,
    failedPerHour: perHour,
    topIps,
    topUsers,
    logins,
    truncated: failed?.truncated ?? false,
  };
};
