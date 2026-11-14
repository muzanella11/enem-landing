import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  redisDB,
  redisHost,
  redisKeyPrefix,
  redisPassword,
  redisPort,
  redisTLSEnabled,
  redisUsername,
} from './redis.constants.js';

/**
 * Ported from mau-apps (`libs/backend/redis/src/lib/redis.service.ts`).
 * Used by `enem-landing-account-api` for signout token blocklisting (Story 03) and
 * `enem-landing-api` as the rate-limit store for public endpoints
 * (Story 06).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: redisHost,
      port: redisPort,
      username: redisUsername || undefined,
      password: redisPassword || undefined,
      db: redisDB,
      tls: redisTLSEnabled ? {} : undefined,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  private withPrefix(key: string): string {
    return redisKeyPrefix ? `${redisKeyPrefix}:${key}` : key;
  }

  private stripPrefix(key: string): string {
    return redisKeyPrefix && key.startsWith(`${redisKeyPrefix}:`)
      ? key.slice(redisKeyPrefix.length + 1)
      : key;
  }

  async getAllKeys(): Promise<string[]> {
    const pattern = redisKeyPrefix ? `${redisKeyPrefix}:*` : '*';
    const keys = await this.client.keys(pattern);
    return keys.map((key: string) => this.stripPrefix(key));
  }

  async getTimeToLive(key: string): Promise<number> {
    return this.client.ttl(this.withPrefix(key));
  }

  async getValue(key: string): Promise<string | null> {
    return this.client.get(this.withPrefix(key));
  }

  async setValue(
    key: string,
    value: string,
    expiryAfterSeconds?: number,
  ): Promise<string | null> {
    const prefixedKey = this.withPrefix(key);
    const result = await this.client.set(prefixedKey, value);

    if (expiryAfterSeconds) {
      await this.client.expire(prefixedKey, expiryAfterSeconds);
    }

    return result;
  }

  async deleteValue(key: string): Promise<number> {
    return this.client.del(this.withPrefix(key));
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(this.withPrefix(key));
  }

  /**
   * Fixed-window counter: atomically increments `key` and starts its expiry
   * on the first hit of the window. Returns the new count and the window's
   * remaining time. One round trip (Lua), so concurrent requests can't both
   * read a stale count.
   */
  async incrementWindow(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; ttlMs: number }> {
    const [count, ttlMs] = (await this.client.eval(
      INCREMENT_WINDOW_SCRIPT,
      1,
      this.withPrefix(key),
      String(windowMs),
    )) as [number, number];
    return { count, ttlMs: ttlMs > 0 ? ttlMs : windowMs };
  }

  /** Removes and returns a key's value in one step (single-use tokens). */
  async takeValue(key: string): Promise<string | null> {
    return this.client.getdel(this.withPrefix(key));
  }
}

const INCREMENT_WINDOW_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return { count, redis.call('PTTL', KEYS[1]) }
`;
