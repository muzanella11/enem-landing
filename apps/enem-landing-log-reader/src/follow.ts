import { open, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError } from './errors.js';
import { MAX_LINE_CHARS } from './limits.js';

export const FOLLOW_POLL_MS = 1000;
export const FOLLOW_MAX_MS = 15 * 60 * 1000;
const HEARTBEAT_MS = 15_000;
/** Bytes read per tick at most; a burst bigger than this continues next tick. */
const MAX_TICK_BYTES = 256 * 1024;
/** Across every client (prod + dev monitor-api), on top of their per-user cap. */
export const MAX_FOLLOW_STREAMS = 12;

let activeStreams = 0;
export const activeFollowStreams = (): number => activeStreams;

export interface FollowOptions<T> {
  path: string;
  /** `null` skips the line (search miss, other stream). */
  transform: (line: string) => T | null;
  pollMs?: number;
  maxMs?: number;
}

/**
 * Live tail as Server-Sent Events: polls the file's size every second and
 * sends only the new complete lines as `data: {"entries":[...]}`. Follows
 * rotation (new inode, or the file got shorter) by starting over at the
 * beginning of the new file. Ends itself after 15 minutes with
 * `event: end`, and stops as soon as the client disconnects.
 */
export const followFile = async <T>(
  req: IncomingMessage,
  res: ServerResponse,
  options: FollowOptions<T>,
): Promise<void> => {
  if (activeStreams >= MAX_FOLLOW_STREAMS) {
    throw new HttpError(429, 'Too many live tails open on the log reader');
  }
  const initial = await stat(options.path);
  activeStreams += 1;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  let inode = initial.ino;
  let offset = initial.size;
  let pending = '';
  let closed = false;
  let busy = false;
  const startedAt = Date.now();
  let lastWrite = Date.now();

  const send = (payload: unknown, event?: string) => {
    if (closed) return;
    res.write(
      `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(payload)}\n\n`,
    );
    lastWrite = Date.now();
  };

  const finish = (reason?: string) => {
    if (closed) return;
    if (reason) send({ reason }, 'end');
    closed = true;
    activeStreams -= 1;
    clearInterval(timer);
    res.end();
  };

  const tick = async () => {
    if (closed || busy) return;
    busy = true;
    try {
      if (Date.now() - startedAt >= (options.maxMs ?? FOLLOW_MAX_MS)) {
        finish('timeout');
        return;
      }
      let stats;
      try {
        stats = await stat(options.path);
      } catch {
        return; // Between rotation's rename and the new file's creation.
      }
      let rotated = false;
      if (stats.ino !== inode || stats.size < offset) {
        inode = stats.ino;
        offset = 0;
        pending = '';
        rotated = true;
      }
      if (stats.size > offset) {
        const length = Math.min(stats.size - offset, MAX_TICK_BYTES);
        const handle = await open(options.path, 'r');
        let text: string;
        try {
          const buffer = Buffer.alloc(length);
          const { bytesRead } = await handle.read(buffer, 0, length, offset);
          offset += bytesRead;
          text = pending + buffer.toString('utf8', 0, bytesRead);
        } finally {
          await handle.close();
        }
        const parts = text.split('\n');
        pending = parts.pop() ?? '';
        if (pending.length > MAX_LINE_CHARS * 4) pending = '';
        const entries: T[] = [];
        for (const part of parts) {
          const line = part.replace(/\r$/, '');
          if (!line) continue;
          const entry = options.transform(
            line.length > MAX_LINE_CHARS
              ? `${line.slice(0, MAX_LINE_CHARS)} …[truncated]`
              : line,
          );
          if (entry !== null) entries.push(entry);
        }
        if (entries.length || rotated) send({ entries, rotated });
      } else if (rotated) {
        send({ entries: [], rotated });
      }
      if (Date.now() - lastWrite >= HEARTBEAT_MS) {
        res.write(': ping\n\n');
        lastWrite = Date.now();
      }
    } catch (error) {
      console.error('[log-reader] follow failed', error);
      finish('error');
    } finally {
      busy = false;
    }
  };

  const timer = setInterval(tick, options.pollMs ?? FOLLOW_POLL_MS);
  req.on('close', () => finish());
  res.on('close', () => finish());
};
