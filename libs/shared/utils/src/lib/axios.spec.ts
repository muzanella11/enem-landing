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
});
