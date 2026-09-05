import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheService } from './cache.service.js';

describe('CacheService', () => {
  let redisService: {
    getValue: ReturnType<typeof vi.fn>;
    setValue: ReturnType<typeof vi.fn>;
    deleteValue: ReturnType<typeof vi.fn>;
    increment: ReturnType<typeof vi.fn>;
    getTimeToLive: ReturnType<typeof vi.fn>;
  };
  let service: CacheService;

  beforeEach(() => {
    redisService = {
      getValue: vi.fn(),
      setValue: vi.fn().mockResolvedValue(undefined),
      deleteValue: vi.fn().mockResolvedValue(1),
      increment: vi.fn().mockResolvedValue(1),
      getTimeToLive: vi.fn().mockResolvedValue(-2),
    };
    service = new CacheService(redisService as never);
  });

  describe('getCached', () => {
    it('parses and returns the cached value, and records a hit', async () => {
      redisService.getValue.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

      await expect(service.getCached('key')).resolves.toEqual({ foo: 'bar' });
      expect(redisService.increment).toHaveBeenCalledWith('stats:hit:key');
      expect(redisService.increment).not.toHaveBeenCalledWith('stats:miss:key');
    });

    it('returns null and records a miss when nothing is cached', async () => {
      redisService.getValue.mockResolvedValue(null);

      await expect(service.getCached('key')).resolves.toBeNull();
      expect(redisService.increment).toHaveBeenCalledWith('stats:miss:key');
    });

    it('swallows Redis errors and returns null instead of throwing', async () => {
      redisService.getValue.mockRejectedValue(new Error('connection reset'));

      await expect(service.getCached('key')).resolves.toBeNull();
    });
  });

  describe('setCached', () => {
    it('stores the value JSON-stringified with the given TTL', async () => {
      await service.setCached('key', { foo: 'bar' }, 60);

      expect(redisService.setValue).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ foo: 'bar' }),
        60,
      );
    });

    it('swallows Redis errors instead of throwing', async () => {
      redisService.setValue.mockRejectedValue(new Error('connection reset'));

      await expect(
        service.setCached('key', 'value', 60),
      ).resolves.toBeUndefined();
    });
  });

  describe('invalidate', () => {
    it('deletes every given key', async () => {
      await service.invalidate('a', 'b');

      expect(redisService.deleteValue).toHaveBeenCalledWith('a');
      expect(redisService.deleteValue).toHaveBeenCalledWith('b');
    });

    it('does nothing when called with no keys', async () => {
      await service.invalidate();

      expect(redisService.deleteValue).not.toHaveBeenCalled();
    });

    it('swallows Redis errors instead of throwing', async () => {
      redisService.deleteValue.mockRejectedValue(new Error('connection reset'));

      await expect(service.invalidate('a')).resolves.toBeUndefined();
    });
  });

  describe('getEntry', () => {
    it('reports an active entry with its size, ttl, and hit/miss counters', async () => {
      redisService.getTimeToLive.mockResolvedValue(120);
      redisService.getValue.mockImplementation((key: string) => {
        if (key === 'stats:hit:key') return Promise.resolve('5');
        if (key === 'stats:miss:key') return Promise.resolve('2');
        return Promise.resolve('{"foo":"bar"}');
      });

      await expect(service.getEntry('key')).resolves.toEqual({
        key: 'key',
        ttl: 120,
        sizeBytes: Buffer.byteLength('{"foo":"bar"}'),
        hits: 5,
        misses: 2,
        active: true,
      });
    });

    it('reports an inactive entry with zero size when nothing is cached', async () => {
      redisService.getTimeToLive.mockResolvedValue(-2);
      redisService.getValue.mockResolvedValue(null);

      await expect(service.getEntry('key')).resolves.toEqual({
        key: 'key',
        ttl: -2,
        sizeBytes: 0,
        hits: 0,
        misses: 0,
        active: false,
      });
    });
  });
});
