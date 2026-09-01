import { describe, expect, it, vi } from 'vitest';
import { benchmark } from './benchmark.js';

describe('benchmark', () => {
  it('returns the wrapped function result', async () => {
    const result = await benchmark('probe', async () => 42);
    expect(result).toBe(42);
  });

  it('rethrows and does not swallow errors', async () => {
    const error = new Error('boom');
    await expect(
      benchmark('probe', async () => {
        throw error;
      }),
    ).rejects.toThrow(error);
  });

  it('logs start/end markers', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await benchmark('probe', async () => 'ok');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
