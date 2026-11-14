import { describe, expect, it } from 'vitest';
import { resolveClientIp } from './client-ip.js';

describe('resolveClientIp', () => {
  it('prefers the CF-Connecting-IP header', () => {
    expect(
      resolveClientIp({
        cfConnectingIp: '203.0.113.7',
        socketAddress: '172.68.1.1',
      }),
    ).toBe('203.0.113.7');
  });

  it('accepts IPv6 addresses', () => {
    expect(resolveClientIp({ cfConnectingIp: ' 2001:db8::1 ' })).toBe(
      '2001:db8::1',
    );
  });

  it('falls back to the socket address without Cloudflare', () => {
    expect(resolveClientIp({ socketAddress: '127.0.0.1' })).toBe('127.0.0.1');
  });

  it('ignores a malformed header value', () => {
    expect(
      resolveClientIp({
        cfConnectingIp: '1.2.3.4, 5.6.7.8',
        socketAddress: '10.0.0.5',
      }),
    ).toBe('10.0.0.5');
  });

  it('returns null when nothing usable is available', () => {
    expect(resolveClientIp({})).toBeNull();
  });
});
