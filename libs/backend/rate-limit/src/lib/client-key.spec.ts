import { describe, expect, it } from 'vitest';
import {
  isPrivateAddress,
  maskClientKey,
  resolveClientKey,
} from './client-key.js';

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1',
    '::1',
    '10.0.1.5',
    '172.16.0.1',
    '172.31.255.1',
    '192.168.1.1',
    '::ffff:10.0.1.7',
    'fd00::1',
  ])('treats %s as private', (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(['203.0.113.7', '172.32.0.1', '8.8.8.8', '2001:db8::1'])(
    'treats %s as public',
    (ip) => expect(isPrivateAddress(ip)).toBe(false),
  );
});

describe('resolveClientKey', () => {
  it('keys a forwarded visitor by IP', () => {
    expect(
      resolveClientKey({ ip: '203.0.113.7', forwardedFor: '203.0.113.7' }),
    ).toEqual({
      key: 'ip:203.0.113.7',
      internal: false,
    });
  });

  it('keys a direct public caller by its socket IP', () => {
    expect(resolveClientKey({ ip: '198.51.100.9' })).toEqual({
      key: 'ip:198.51.100.9',
      internal: false,
    });
  });

  it('gives a private caller without a visitor IP its own internal key', () => {
    expect(resolveClientKey({ ip: '::ffff:10.0.1.7' })).toEqual({
      key: 'internal:10.0.1.7',
      internal: true,
    });
  });

  it('keeps a forwarded local-dev visitor out of the internal bucket', () => {
    expect(
      resolveClientKey({ ip: '127.0.0.1', forwardedFor: '127.0.0.1' }).internal,
    ).toBe(false);
  });
});

describe('maskClientKey', () => {
  it('hides the last two IPv4 octets', () => {
    expect(maskClientKey('ip:203.0.113.7')).toBe('ip:203.0.x.x');
  });

  it('keeps only the first IPv6 groups', () => {
    expect(maskClientKey('ip:2001:db8:1:2::1')).toBe('ip:2001:db8:x');
  });
});
