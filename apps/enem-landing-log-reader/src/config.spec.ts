import { describe, expect, it } from 'vitest';
import { isAuthorized } from './auth.js';
import { loadConfig } from './config.js';

describe('config and auth', () => {
  it('ignores tokens shorter than 32 characters', () => {
    expect(
      loadConfig({ LOG_READER_TOKENS: `short,${'x'.repeat(32)}` }).tokens,
    ).toEqual(['x'.repeat(32)]);
  });

  it('accepts any configured token and nothing else', () => {
    const tokens = ['p'.repeat(32), 'd'.repeat(32)];
    expect(isAuthorized('p'.repeat(32), tokens)).toBe(true);
    expect(isAuthorized('d'.repeat(32), tokens)).toBe(true);
    expect(isAuthorized('p'.repeat(31), tokens)).toBe(false);
    expect(isAuthorized(undefined, tokens)).toBe(false);
    expect(isAuthorized('p'.repeat(32), [])).toBe(false);
  });
});
