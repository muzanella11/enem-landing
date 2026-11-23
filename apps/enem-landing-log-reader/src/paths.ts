import { realpath } from 'node:fs/promises';
import { sep } from 'node:path';
import { HttpError } from './errors.js';

/**
 * Last line of defence against path traversal: the client never sends a
 * path (only allowlisted ids and indexes), and every path is built from a
 * fixed root plus names read from `readdir`. This still resolves symlinks
 * and refuses anything that ends up outside the root.
 */
export const assertInsideRoot = async (
  root: string,
  path: string,
): Promise<string> => {
  const [realRoot, realPath] = await Promise.all([
    realpath(root),
    realpath(path),
  ]).catch(() => {
    throw new HttpError(404, 'Log file not found');
  });
  if (realPath !== realRoot && !realPath.startsWith(realRoot + sep)) {
    throw new HttpError(403, 'Path outside the allowed directory');
  }
  return realPath;
};

/** A single directory entry name: no separators, no `.`/`..`, no NUL. */
export const isPlainName = (name: string): boolean =>
  name.length > 0 &&
  name !== '.' &&
  name !== '..' &&
  !name.includes('/') &&
  !name.includes('\\') &&
  !name.includes('\0');
