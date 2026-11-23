import { createHash, timingSafeEqual } from 'node:crypto';

const digest = (value: string): Buffer =>
  createHash('sha256').update(value).digest();

/**
 * Constant-time check of the `X-Log-Reader-Token` header against every
 * configured token (prod and dev monitor-api each have their own).
 * Hashing first makes the comparison length-independent.
 */
export const isAuthorized = (
  header: string | string[] | undefined,
  tokens: string[],
): boolean => {
  if (typeof header !== 'string' || header.length === 0 || tokens.length === 0)
    return false;
  const given = digest(header);
  let ok = false;
  for (const token of tokens) {
    if (timingSafeEqual(given, digest(token))) ok = true;
  }
  return ok;
};
