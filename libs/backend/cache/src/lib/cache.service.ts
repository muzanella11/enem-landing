import { RedisService } from '@enem-landing/backend-redis';
import { Injectable, Logger } from '@nestjs/common';
import type { CacheEntry } from './cache.types.js';

const hitStatKey = (key: string): string => `stats:hit:${key}`;
const missStatKey = (key: string): string => `stats:miss:${key}`;

/**
 * A cache-aside layer over Redis for public GET endpoints, tracking
 * per-key hit/miss counters so enem-landing-cms's cache management page
 * can show a hit rate. Every operation swallows Redis errors - caching is
 * an optimization, never a reason for a public endpoint to fail.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redisService: RedisService) {}

  async getCached<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisService.getValue(key);
      if (raw !== null) {
        this.recordStat(hitStatKey(key));
        return JSON.parse(raw) as T;
      }
      this.recordStat(missStatKey(key));
      return null;
    } catch (error) {
      this.logger.warn(`Cache read failed for ${key}`, error);
      return null;
    }
  }

  /**
   * Fire-and-forget counter bump. It must carry its own catch: a rejected
   * promise nobody awaits is an unhandled rejection, which kills the Node
   * process. That is how a Redis quota error (Upstash "max requests limit
   * exceeded") took the whole API down in a restart loop.
   */
  private recordStat(statKey: string): void {
    this.redisService.increment(statKey).catch(() => undefined);
  }

  async setCached(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.redisService.setValue(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      this.logger.warn(`Cache write failed for ${key}`, error);
    }
  }

  async invalidate(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await Promise.all(keys.map((key) => this.redisService.deleteValue(key)));
    } catch (error) {
      this.logger.warn(
        `Cache invalidation failed for ${keys.join(', ')}`,
        error,
      );
    }
  }

  async getEntry(key: string): Promise<CacheEntry> {
    const [ttl, raw, hits, misses] = await Promise.all([
      this.redisService.getTimeToLive(key),
      this.redisService.getValue(key),
      this.redisService
        .getValue(hitStatKey(key))
        .then((value) => Number(value ?? 0)),
      this.redisService
        .getValue(missStatKey(key))
        .then((value) => Number(value ?? 0)),
    ]);

    return {
      key,
      ttl,
      sizeBytes: raw ? Buffer.byteLength(raw) : 0,
      hits,
      misses,
      active: ttl > 0,
    };
  }
}
