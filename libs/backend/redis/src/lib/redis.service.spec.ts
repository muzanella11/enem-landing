import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redisClientMock = {
  get: vi.fn(),
  set: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  ttl: vi.fn(),
  quit: vi.fn(),
  eval: vi.fn(),
  getdel: vi.fn(),
};

vi.mock('ioredis', () => ({
  Redis: vi.fn(function RedisMock() {
    return redisClientMock;
  }),
}));

describe('RedisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env['REDIS_KEY_PREFIX'];
  });

  it('reads/writes values without a prefix by default', async () => {
    const { RedisService } = await import('./redis.service.js');
    const service = new RedisService();

    redisClientMock.get.mockResolvedValue('bar');
    await expect(service.getValue('foo')).resolves.toBe('bar');
    expect(redisClientMock.get).toHaveBeenCalledWith('foo');

    redisClientMock.set.mockResolvedValue('OK');
    await service.setValue('foo', 'bar', 60);
    expect(redisClientMock.set).toHaveBeenCalledWith('foo', 'bar');
    expect(redisClientMock.expire).toHaveBeenCalledWith('foo', 60);
  });

  it('scopes keys to REDIS_KEY_PREFIX when set', async () => {
    process.env['REDIS_KEY_PREFIX'] = 'dev';
    const { RedisService } = await import('./redis.service.js');
    const service = new RedisService();

    redisClientMock.del.mockResolvedValue(1);
    await service.deleteValue('session:1');
    expect(redisClientMock.del).toHaveBeenCalledWith('dev:session:1');

    redisClientMock.keys.mockResolvedValue(['dev:session:1', 'dev:session:2']);
    await expect(service.getAllKeys()).resolves.toEqual(['session:1', 'session:2']);
    expect(redisClientMock.keys).toHaveBeenCalledWith('dev:*');
  });

  it('counts hits in a fixed window with one atomic call', async () => {
    process.env['REDIS_KEY_PREFIX'] = 'dev';
    const { RedisService } = await import('./redis.service.js');
    const service = new RedisService();

    redisClientMock.eval.mockResolvedValue([3, 41_000]);
    await expect(service.incrementWindow('rl:ip', 60_000)).resolves.toEqual({
      count: 3,
      ttlMs: 41_000,
    });
    expect(redisClientMock.eval).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'dev:rl:ip',
      '60000',
    );
  });

  it('falls back to the full window when the key has no ttl', async () => {
    const { RedisService } = await import('./redis.service.js');
    const service = new RedisService();

    redisClientMock.eval.mockResolvedValue([1, -1]);
    await expect(service.incrementWindow('rl:ip', 60_000)).resolves.toEqual({
      count: 1,
      ttlMs: 60_000,
    });
  });

  it('takes a value exactly once', async () => {
    const { RedisService } = await import('./redis.service.js');
    const service = new RedisService();

    redisClientMock.getdel.mockResolvedValue('token');
    await expect(service.takeValue('captcha:1')).resolves.toBe('token');
    expect(redisClientMock.getdel).toHaveBeenCalledWith('captcha:1');
  });
});
