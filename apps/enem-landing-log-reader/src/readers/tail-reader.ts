import { createReadStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { createGunzip } from 'node:zlib';
import { HttpError } from '../errors.js';
import {
  GZIP_WINDOW_BYTES,
  MAX_GZIP_BYTES,
  MAX_LINE_CHARS,
  MAX_RESPONSE_BYTES,
  MAX_SCAN_BYTES,
  READ_CHUNK_BYTES,
} from '../limits.js';

/**
 * Called once per line, newest line first. Returns the entry to keep, or
 * `null` to skip the line (search miss, or a line that only belongs to a
 * multi-line entry still being assembled).
 */
export type LineTransform<T> = (line: string) => T | null;

export interface TailOptions<T> {
  /** Exclusive end offset (bytes, decompressed for `.gz`). Defaults to EOF. */
  before?: number;
  limit: number;
  transform: LineTransform<T>;
  deadline: number;
  maxScanBytes?: number;
}

export interface TailResult<T> {
  /** Oldest first. */
  entries: T[];
  nextBefore: number | null;
  truncated: boolean;
  fileSize: number;
}

interface RawLine {
  start: number;
  bytes: Buffer;
}

const decodeLine = (bytes: Buffer): string => {
  const text = bytes.toString('utf8').replace(/\r$/, '');
  return text.length > MAX_LINE_CHARS
    ? `${text.slice(0, MAX_LINE_CHARS)} …[truncated]`
    : text;
};

/**
 * Walks lines newest-first and applies the page budget. Shared by the
 * plain-file reader (lines come from backwards chunk reads) and the gzip
 * reader (lines come from a bounded window of the decompressed stream).
 */
class PageCollector<T> {
  readonly entries: T[] = [];
  private bytes = 0;
  earliestStart: number | null = null;
  done = false;
  truncated = false;

  constructor(
    private readonly options: TailOptions<T>,
    private readonly scanStart: number,
  ) {}

  push(line: RawLine): void {
    if (this.done) return;
    this.earliestStart = line.start;
    if (line.bytes.length > 0) {
      const entry = this.options.transform(decodeLine(line.bytes));
      if (entry !== null) {
        this.entries.push(entry);
        this.bytes += line.bytes.length;
      }
    }
    if (this.entries.length >= this.options.limit) {
      this.done = true;
    } else if (this.bytes >= MAX_RESPONSE_BYTES) {
      this.done = true;
      this.truncated = true;
    } else if (
      this.scanStart - line.start >=
      (this.options.maxScanBytes ?? MAX_SCAN_BYTES)
    ) {
      this.done = true;
      this.truncated = true;
    } else if (Date.now() > this.options.deadline) {
      this.done = true;
      this.truncated = true;
    }
  }

  result(fileSize: number): TailResult<T> {
    const nextBefore =
      this.earliestStart !== null && this.earliestStart > 0
        ? this.earliestStart
        : null;
    return {
      entries: this.entries.reverse(),
      nextBefore,
      truncated: this.truncated,
      fileSize,
    };
  }
}

/** Reads a plain text file backwards in chunks, never loading it whole. */
export const tailPlainFile = async <T>(
  path: string,
  options: TailOptions<T>,
): Promise<TailResult<T>> => {
  const handle = await open(path, 'r');
  try {
    const { size } = await handle.stat();
    const end = Math.min(options.before ?? size, size);
    const collector = new PageCollector(options, end);
    let position = end;
    let leftover: Buffer = Buffer.alloc(0);

    while (position > 0 && !collector.done) {
      const readStart = Math.max(0, position - READ_CHUNK_BYTES);
      const chunk = Buffer.alloc(position - readStart);
      await handle.read(chunk, 0, chunk.length, readStart);
      let combined = Buffer.concat([chunk, leftover]);
      position = readStart;

      let lineEnd = combined.length;
      // Trailing newline of the very last line in the range.
      if (
        lineEnd > 0 &&
        combined[lineEnd - 1] === 0x0a &&
        readStart + lineEnd === end
      ) {
        lineEnd -= 1;
      }
      for (let index = lineEnd - 1; index >= 0 && !collector.done; index -= 1) {
        if (combined[index] === 0x0a) {
          collector.push({
            start: readStart + index + 1,
            bytes: combined.subarray(index + 1, lineEnd),
          });
          lineEnd = index;
        }
      }
      leftover = Buffer.from(combined.subarray(0, lineEnd));
      combined = Buffer.alloc(0);

      // A single line longer than the response budget (or a binary file
      // without newlines): emit it as one truncated line instead of
      // growing the buffer forever.
      if (!collector.done && leftover.length > MAX_RESPONSE_BYTES) {
        collector.push({
          start: position,
          bytes: leftover.subarray(leftover.length - MAX_LINE_CHARS),
        });
        leftover = Buffer.alloc(0);
      }
    }

    if (!collector.done && leftover.length > 0) {
      collector.push({ start: 0, bytes: leftover });
    }
    return collector.result(size);
  } finally {
    await handle.close();
  }
};

/**
 * `.gz` rotations can't be read backwards, so the file is decompressed as
 * a stream (capped at `MAX_GZIP_BYTES`), keeping only a bounded window of
 * the newest raw lines before `before`. That window is then walked
 * newest-first like a plain file.
 */
export const tailGzipFile = async <T>(
  path: string,
  options: TailOptions<T>,
): Promise<TailResult<T>> => {
  const before = options.before ?? Number.POSITIVE_INFINITY;
  const window: RawLine[] = [];
  let windowBytes = 0;
  let offset = 0;
  let pending: Buffer = Buffer.alloc(0);
  let pendingStart = 0;

  const keep = (line: RawLine) => {
    if (line.start >= before) return;
    window.push(line);
    windowBytes += line.bytes.length;
    while (windowBytes > GZIP_WINDOW_BYTES && window.length > 1) {
      windowBytes -= window.shift()?.bytes.length ?? 0;
    }
  };

  await new Promise<void>((resolve, reject) => {
    const input = createReadStream(path);
    const gunzip = createGunzip();
    const fail = (error: Error) => {
      input.destroy();
      gunzip.destroy();
      reject(error);
    };
    gunzip.on('data', (chunk: Buffer) => {
      if (offset + chunk.length > MAX_GZIP_BYTES) {
        fail(
          new HttpError(
            413,
            'Decompressed file is larger than 50 MB; search within a smaller rotation instead',
          ),
        );
        return;
      }
      if (Date.now() > options.deadline) {
        fail(new HttpError(504, 'Reading the compressed file took too long'));
        return;
      }
      const data = pending.length ? Buffer.concat([pending, chunk]) : chunk;
      const dataStart = pending.length ? pendingStart : offset;
      offset += chunk.length;
      let lineStart = 0;
      for (let index = 0; index < data.length; index += 1) {
        if (data[index] === 0x0a) {
          keep({
            start: dataStart + lineStart,
            bytes: Buffer.from(data.subarray(lineStart, index)),
          });
          lineStart = index + 1;
        }
      }
      pending = Buffer.from(data.subarray(lineStart));
      pendingStart = dataStart + lineStart;
      if (pendingStart >= before) {
        input.destroy();
        gunzip.destroy();
        resolve();
      }
    });
    gunzip.on('end', () => {
      if (pending.length > 0) keep({ start: pendingStart, bytes: pending });
      resolve();
    });
    gunzip.on('error', (error) =>
      fail(new HttpError(422, `Invalid gzip file: ${error.message}`)),
    );
    input.on('error', (error) => fail(error));
    input.pipe(gunzip);
  });

  const scanStart = window.length
    ? window[window.length - 1].start + window[window.length - 1].bytes.length
    : 0;
  const collector = new PageCollector(options, scanStart);
  for (
    let index = window.length - 1;
    index >= 0 && !collector.done;
    index -= 1
  ) {
    collector.push(window[index]);
  }
  return collector.result(offset);
};

export const tailFile = <T>(
  path: string,
  compressed: boolean,
  options: TailOptions<T>,
): Promise<TailResult<T>> =>
  compressed ? tailGzipFile(path, options) : tailPlainFile(path, options);

/** Case-insensitive substring match, the only search the viewer offers. */
export const textMatcher = (
  query: string | undefined,
): ((text: string) => boolean) => {
  if (!query) return () => true;
  const needle = query.toLowerCase();
  return (text) => text.toLowerCase().includes(needle);
};
