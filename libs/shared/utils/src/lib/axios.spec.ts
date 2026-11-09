import { describe, expect, it } from 'vitest';
import { createAxiosInstance } from './axios.js';

describe('createAxiosInstance', () => {
  it('applies the given baseURL', () => {
    const instance = createAxiosInstance({ baseURL: 'http://localhost:3000' });
    expect(instance.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('sets a JSON content-type header by default', () => {
    const instance = createAxiosInstance({});
    expect((instance.defaults.headers as Record<string, unknown>)['Content-Type']).toBe(
      'application/json',
    );
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
      await expect(respondWith({ statusCode: 200, message: 'Deleted' }, true)).resolves.toBeUndefined();
    });

    it('leaves non-envelope bodies alone', async () => {
      await expect(respondWith([1, 2], true)).resolves.toEqual([1, 2]);
    });
  });
});
