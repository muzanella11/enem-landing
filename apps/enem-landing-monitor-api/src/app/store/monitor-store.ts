import { RedisService } from '@enem-landing/backend-redis';
import { Injectable } from '@nestjs/common';

/** The ioredis commands this app uses; a fake implements them in tests. */
export interface StoreClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    ...args: Array<string | number>
  ): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  mget(...keys: string[]): Promise<Array<string | null>>;
  expire(key: string, seconds: number): Promise<number>;
  append(key: string, value: string): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lpop(key: string): Promise<string | null>;
  rpop(key: string): Promise<string | null>;
  lset(key: string, index: number, value: string): Promise<unknown>;
  llen(key: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
  ): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, field: string, value: string): Promise<number>;
  hdel(key: string, ...fields: string[]): Promise<number>;
}

/** Shared between prod and dev monitor-api: host-level data (one host). */
export const SHARED_PREFIX = 'monitor-shared';

/**
 * Small key/value layer over the shared Redis (`maxmemory 96mb`). `key()`
 * is scoped to this environment (`monitor:` in prod, `dev:monitor:` in
 * dev), `shared()` is the same key for both, for host data that only prod
 * writes (metrics, deploy history, known IPs, geo cache). Every key this
 * app writes has a TTL or a hard length cap.
 */
@Injectable()
export class MonitorStore {
  readonly client: StoreClient;
  private readonly prefix: (key: string) => string;

  constructor(redis: RedisService) {
    this.client = redis.getClient() as unknown as StoreClient;
    this.prefix = (key) => redis.prefixedKey(key);
  }

  static forTesting(client: StoreClient, prefix = 'monitor'): MonitorStore {
    const store = Object.create(MonitorStore.prototype) as MonitorStore;
    Object.assign(store, {
      client,
      prefix: (key: string) => `${prefix}:${key}`,
    });
    return store;
  }

  key(name: string): string {
    return this.prefix(name);
  }

  shared(name: string): string {
    return `${SHARED_PREFIX}:${name}`;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  /** `SET key value EX ttl NX`: true when this call created the key. */
  async setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    return (await this.client.set(key, value, 'EX', ttlSeconds, 'NX')) === 'OK';
  }

  /** Newest-first capped list with a TTL (history lists). */
  async pushCapped(
    key: string,
    value: unknown,
    maxLength: number,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.lpush(key, JSON.stringify(value));
    await this.client.ltrim(key, 0, maxLength - 1);
    await this.client.expire(key, ttlSeconds);
  }

  async listJson<T>(key: string, limit: number): Promise<T[]> {
    const rows = await this.client.lrange(key, 0, limit - 1);
    const values: T[] = [];
    for (const row of rows) {
      try {
        values.push(JSON.parse(row) as T);
      } catch {
        // Skip a corrupt row instead of failing the whole list.
      }
    }
    return values;
  }

  async hashJson<T>(key: string): Promise<Record<string, T>> {
    const raw = await this.client.hgetall(key);
    const values: Record<string, T> = {};
    for (const [field, value] of Object.entries(raw ?? {})) {
      try {
        values[field] = JSON.parse(value) as T;
      } catch {
        // ignore
      }
    }
    return values;
  }
}
