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
}
