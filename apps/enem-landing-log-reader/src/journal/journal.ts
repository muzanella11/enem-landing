import { spawn } from 'node:child_process';
import type { JournalEntry, JournalPage } from '@enem-landing/shared-types';
import { HttpError } from '../errors.js';
import { MAX_LINE_CHARS } from '../limits.js';

export interface JournalQuery {
  unit?: string;
  priority?: number;
  since?: string;
  until?: string;
  limit: number;
  cursor?: string;
  q?: string;
}

export const UNIT_PATTERN = /^[A-Za-z0-9@._:\\-]{1,128}$/;
export const CURSOR_PATTERN = /^[A-Za-z0-9=;_-]{1,512}$/;
/** `2026-11-23T10:00` or `2026-11-23T10:00:00` (UTC, from the browser). */
export const TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

const toJournalTime = (value: string): string => {
  const [date, time] = value.split('T');
  return `${date} ${time.length === 5 ? `${time}:00` : time} UTC`;
};

const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Arguments for `journalctl`, passed as an array (no shell). Every value
 * was validated against the patterns above before it gets here.
 */
export const buildJournalArgs = (
  directory: string,
  query: JournalQuery,
): string[] => {
  const args = [
    `--directory=${directory}`,
    '--output=json',
    '--no-pager',
    '--reverse',
    '--quiet',
    '--output-fields=__CURSOR,__REALTIME_TIMESTAMP,PRIORITY,_SYSTEMD_UNIT,SYSLOG_IDENTIFIER,_PID,MESSAGE',
    `--lines=${query.limit}`,
  ];
  if (query.unit) args.push(`--unit=${query.unit}`);
  if (query.priority !== undefined) args.push(`--priority=${query.priority}`);
  if (query.since) args.push(`--since=${toJournalTime(query.since)}`);
  if (query.until) args.push(`--until=${toJournalTime(query.until)}`);
  // With --reverse, journalctl walks backwards from the cursor and skips
  // the cursor entry itself, which is exactly "load older".
  if (query.cursor) args.push(`--after-cursor=${query.cursor}`);
  if (query.q)
    args.push(`--grep=${escapeRegex(query.q)}`, '--case-sensitive=false');
  return args;
};

const fieldText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value))
    return Buffer.from(value as number[]).toString('utf8');
  return '';
};

export const parseJournalLine = (line: string): JournalEntry | null => {
  try {
    const raw = JSON.parse(line) as Record<string, unknown>;
    const micros = Number(fieldText(raw['__REALTIME_TIMESTAMP']));
    const message = fieldText(raw['MESSAGE']);
    const priority = fieldText(raw['PRIORITY']);
    return {
      cursor: fieldText(raw['__CURSOR']),
      time: Number.isFinite(micros)
        ? new Date(micros / 1000).toISOString()
        : '',
      priority: priority === '' ? null : Number(priority),
      unit: fieldText(raw['_SYSTEMD_UNIT']),
      identifier: fieldText(raw['SYSLOG_IDENTIFIER']),
      pid: fieldText(raw['_PID']),
      message:
        message.length > MAX_LINE_CHARS
          ? `${message.slice(0, MAX_LINE_CHARS)} …[truncated]`
          : message,
    };
  } catch {
    return null;
  }
};

interface RunResult {
  lines: string[];
  truncated: boolean;
}

const run = (
  bin: string,
  args: string[],
  maxLines: number,
  timeoutMs: number,
): Promise<RunResult> =>
  new Promise((resolve, reject) => {
    // A missing binary surfaces as an 'error' event (ENOENT), not a throw.
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const lines: string[] = [];
    let pending = '';
    let bytes = 0;
    let stderr = '';
    let truncated = false;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      child.kill('SIGKILL');
      resolve({ lines, truncated });
    };
    const timer = setTimeout(() => {
      truncated = true;
      finish();
    }, timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      bytes += chunk.length;
      const parts = (pending + chunk).split('\n');
      pending = parts.pop() ?? '';
      for (const part of parts) {
        if (part) lines.push(part);
        if (lines.length >= maxLines) return finish();
      }
      if (bytes > MAX_OUTPUT_BYTES) {
        truncated = true;
        finish();
      }
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(-2000);
    });
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (finished) return;
      finished = true;
      reject(
        error.code === 'ENOENT'
          ? new HttpError(
              501,
              'journalctl is not available in this environment',
            )
          : error,
      );
    });
    child.on('close', (code) => {
      if (finished) return;
      if (pending) lines.push(pending);
      // journalctl exits 1 when --grep matched nothing.
      if (code !== 0 && code !== 1 && lines.length === 0) {
        finished = true;
        clearTimeout(timer);
        reject(
          new HttpError(
            502,
            `journalctl failed: ${stderr.trim() || `exit ${code}`}`,
          ),
        );
        return;
      }
      finish();
    });
  });

export const readJournal = async (
  bin: string,
  directory: string,
  query: JournalQuery,
  timeoutMs: number,
): Promise<JournalPage> => {
  const { lines, truncated } = await run(
    bin,
    buildJournalArgs(directory, query),
    query.limit,
    timeoutMs,
  );
  const entries = lines
    .map(parseJournalLine)
    .filter((entry): entry is JournalEntry => entry !== null);
  const oldest = entries[entries.length - 1];
  return {
    entries: entries.reverse(),
    nextCursor:
      entries.length >= query.limit && oldest?.cursor ? oldest.cursor : null,
    truncated,
  };
};

export const listJournalUnits = async (
  bin: string,
  directory: string,
  timeoutMs: number,
): Promise<string[]> => {
  const { lines } = await run(
    bin,
    [
      `--directory=${directory}`,
      '--no-pager',
      '--quiet',
      '--field=_SYSTEMD_UNIT',
    ],
    5000,
    timeoutMs,
  );
  return lines.filter((unit) => UNIT_PATTERN.test(unit)).sort();
};
