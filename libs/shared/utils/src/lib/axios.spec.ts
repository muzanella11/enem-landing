import { describe, expect, it, vi } from 'vitest';
import { createAxiosInstance } from './axios.js';

describe('createAxiosInstance', () => {
  it('applies the given baseURL', () => {
    const instance = createAxiosInstance({ baseURL: 'http://localhost:3000' });
    expect(instance.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('sets a JSON content-type header by default', () => {
    const instance = createAxiosInstance({});
    expect(
      (instance.defaults.headers as Record<string, unknown>)['Content-Type'],
    ).toBe('application/json');
  });

  describe('unwrapEnvelope', () => {
    const respondWith = (body: unknown, unwrapEnvelope?: boolean) => {
      const instance = createAxiosInstance({ unwrapEnvelope });
      instance.defaults.adapter = async (requestConfig) => ({
        data: body,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: requestConfig,
      });
      return instance.get('/probe') as Promise<unknown>;
    };
    const envelope = { statusCode: 200, message: 'Success', data: { id: 1 } };

    it('keeps the whole envelope by default', async () => {
      await expect(respondWith(envelope)).resolves.toEqual(envelope);
    });

    it('resolves with the envelope data when enabled', async () => {
      await expect(respondWith(envelope, true)).resolves.toEqual({ id: 1 });
    });

    it('resolves with undefined for an envelope without data', async () => {
      await expect(
        respondWith({ statusCode: 200, message: 'Deleted' }, true),
      ).resolves.toBeUndefined();
    });

    it('leaves non-envelope bodies alone', async () => {
      await expect(respondWith([1, 2], true)).resolves.toEqual([1, 2]);
    });
  });

  describe('visitor forwarding', () => {
    it('sends the visitor IP as X-Forwarded-For', () => {
      const instance = createAxiosInstance({ forwardedFor: '203.0.113.7' });
      expect(
        (instance.defaults.headers as Record<string, unknown>)[
          'X-Forwarded-For'
        ],
      ).toBe('203.0.113.7');
    });

    it('omits the header without an IP', () => {
      const instance = createAxiosInstance({ forwardedFor: null });
      expect(
        (instance.defaults.headers as Record<string, unknown>)[
          'X-Forwarded-For'
        ],
      ).toBeUndefined();
    });

    it('reports Retry-After from a failed response', async () => {
      const onRetryAfter = vi.fn();
      const instance = createAxiosInstance({ onRetryAfter });
      instance.defaults.adapter = async (requestConfig) => {
        throw Object.assign(new Error('Too many requests'), {
          config: requestConfig,
          response: { status: 429, headers: { 'retry-after': '42' } },
        });
      };
      await expect(instance.get('/probe')).rejects.toThrow('Too many requests');
      expect(onRetryAfter).toHaveBeenCalledWith('42');
    });
  });
});
