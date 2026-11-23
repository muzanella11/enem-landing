import { open } from 'node:fs/promises';

const PROBE_BYTES = 16 * 1024;

/**
 * Byte offset of the first line whose time is after `targetMs`, found by
 * binary search over a plain (uncompressed) log file. Used as `before`, so
 * the next page ends at that moment. Lines without a parsable time are
 * skipped while probing. Returns the file size when every line is older.
 */
export const seekTime = async (
  path: string,
  targetMs: number,
  timeOf: (line: string) => number | null,
): Promise<{ offset: number; fileSize: number }> => {
  const handle = await open(path, 'r');
  try {
    const { size } = await handle.stat();
    const buffer = Buffer.alloc(PROBE_BYTES);

    /** First timed line starting at or after `from`. */
    const probe = async (
      from: number,
    ): Promise<{ start: number; time: number } | null> => {
      let position = from;
      let aligned = from === 0;
      while (position < size) {
        const { bytesRead } = await handle.read(
          buffer,
          0,
          PROBE_BYTES,
          position,
        );
        if (bytesRead === 0) return null;
        const chunk = buffer.subarray(0, bytesRead);
        const atEof = position + bytesRead >= size;
        let cursor = 0;
        if (!aligned) {
          const newline = chunk.indexOf(0x0a);
          if (newline === -1) {
            position += bytesRead;
            continue;
          }
          cursor = newline + 1;
          aligned = true;
        }
        let consumed = cursor;
        while (cursor < bytesRead) {
          let end = chunk.indexOf(0x0a, cursor);
          if (end === -1) {
            if (!atEof) break;
            end = bytesRead;
          }
          const time = timeOf(chunk.toString('utf8', cursor, end));
          if (time !== null) return { start: position + cursor, time };
          cursor = end + 1;
          consumed = cursor;
        }
        if (atEof) return null;
        if (consumed === 0) {
          // One line longer than the probe buffer: skip past it.
          aligned = false;
          position += bytesRead;
        } else {
          position += consumed;
        }
      }
      return null;
    };

    let lo = 0;
    let hi = size;
    while (hi - lo > PROBE_BYTES) {
      const mid = Math.floor((lo + hi) / 2);
      const found = await probe(mid);
      if (!found || found.start >= hi) {
        hi = mid;
      } else if (found.time <= targetMs) {
        lo = found.start + 1;
      } else {
        hi = found.start;
      }
    }
    // Linear finish inside the last window.
    let position = lo === 0 ? 0 : lo - 1;
    while (position < hi) {
      const found = await probe(position);
      if (!found || found.start >= hi) break;
      if (found.time > targetMs) return { offset: found.start, fileSize: size };
      position = found.start + 1;
    }
    return { offset: hi, fileSize: size };
  } finally {
    await handle.close();
  }
};
