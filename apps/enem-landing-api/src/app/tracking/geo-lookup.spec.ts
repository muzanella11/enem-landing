import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupGeo } from './geo-lookup.js';

describe('lookupGeo', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns an empty result for a null ip without calling the API', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as never;

    const result = await lookupGeo(null);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });

  it.each(['127.0.0.1', '::1', '10.0.0.5', '192.168.1.1'])(
    'returns an empty result for private ip %s without calling the API',
    async (ip) => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy as never;

      const result = await lookupGeo(ip);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.country).toBeNull();
    },
  );

  it('maps a successful lookup to the expected shape', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'success',
          country: 'Indonesia',
          region: 'JK',
          city: 'Jakarta',
          lat: -6.2,
          lon: 106.8,
        }),
    }) as never;

    const result = await lookupGeo('8.8.8.8');

    expect(result).toEqual({
      country: 'Indonesia',
      region: 'JK',
      city: 'Jakarta',
      latitude: -6.2,
      longitude: 106.8,
    });
  });

  it('returns an empty result when the API reports a non-success status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'fail', message: 'private range' }),
    }) as never;

    const result = await lookupGeo('8.8.8.8');

    expect(result.country).toBeNull();
  });

  it('returns an empty result when the response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as never;

    const result = await lookupGeo('8.8.8.8');

    expect(result.country).toBeNull();
  });

  it('returns an empty result instead of throwing on a network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('timeout')) as never;

    const result = await lookupGeo('8.8.8.8');

    expect(result).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });
});
