import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redisClientMock = {
  get: vi.fn(),
  set: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  ttl: vi.fn(),
  quit: vi.fn(),
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
});
