import { describe, expect, it } from 'vitest';
import { buildAdsTxt, publisherIdFromClientId } from './adsense.js';

describe('adsense helpers', () => {
  it('extracts the publisher id from a client id', () => {
    expect(publisherIdFromClientId('ca-pub-1234567890123456')).toBe(
      'pub-1234567890123456',
    );
    expect(publisherIdFromClientId(' ca-pub-1234567890 ')).toBe(
      'pub-1234567890',
    );
  });

  it('rejects anything else', () => {
    expect(publisherIdFromClientId(null)).toBeNull();
    expect(publisherIdFromClientId('pub-1234567890')).toBeNull();
    expect(publisherIdFromClientId('ca-pub-abc')).toBeNull();
  });

  it('builds the ads.txt line', () => {
    expect(buildAdsTxt('ca-pub-1234567890123456')).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    );
    expect(buildAdsTxt('')).toBeNull();
  });
});
