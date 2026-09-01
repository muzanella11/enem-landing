import { describe, expect, it } from 'vitest';
import { ensureHttps } from './ensure-https.js';

describe('ensureHttps', () => {
  it('prepends https:// when no scheme is present', () => {
    expect(ensureHttps('example.com')).toBe('https://example.com');
  });

  it('leaves an existing https:// URL untouched', () => {
    expect(ensureHttps('https://example.com')).toBe('https://example.com');
  });

  it('leaves an existing http:// URL untouched (no scheme upgrade)', () => {
    expect(ensureHttps('http://localhost:3000')).toBe('http://localhost:3000');
  });
});
