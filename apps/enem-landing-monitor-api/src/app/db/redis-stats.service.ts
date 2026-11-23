import { RedisService } from '@enem-landing/backend-redis';
import type { RedisStats } from '@enem-landing/shared-types';
import { Injectable } from '@nestjs/common';

/** `INFO` text -> key -> value (comments and section headers skipped). */
export const parseInfo = (text: string): Record<string, string> => {
  const info: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf(':');
    if (index > 0) info[line.slice(0, index)] = line.slice(index + 1);
  }
  return info;
};

const num = (value: string | undefined): number | null => {
  if (value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * Groups keys by prefix: the first segment, plus the second one for the
 * environment prefixes (`dev:monitor`, `dev:cache`), so prod, dev and the
 * monitor's own keys can be told apart.
 */
export const prefixOf = (key: string): string => {
  const parts = key.split(':');
  if (parts.length === 1) return '(tanpa prefix)';
  if ((parts[0] === 'dev' || parts[0] === 'e2e') && parts.length > 2)
    return `${parts[0]}:${parts[1]}`;
  return parts[0];
};

const SCAN_BUDGET_MS = 3000;
const PREFIX_CACHE_MS = 5 * 60_000;

/** Redis numbers for the Redis menu. The keys are counted with SCAN, never KEYS. */
@Injectable()
export class RedisStatsService {
  private prefixCache: {
    at: number;
    counts: Array<{ prefix: string; count: number }>;
    truncated: boolean;
  } | null = null;

  constructor(private readonly redis: RedisService) {}

  async info(): Promise<Record<string, string>> {
    return parseInfo(await this.redis.getClient().info());
  }

  private async keysByPrefix(force: boolean) {
    if (
      !force &&
      this.prefixCache &&
      Date.now() - this.prefixCache.at < PREFIX_CACHE_MS
    )
      return this.prefixCache;
    const client = this.redis.getClient();
    const counts = new Map<string, number>();
    let cursor = '0';
    let truncated = false;
    const deadline = Date.now() + SCAN_BUDGET_MS;
    do {
      const [next, keys] = await client.scan(cursor, 'COUNT', 1000);
      cursor = next;
      for (const key of keys)
        counts.set(prefixOf(key), (counts.get(prefixOf(key)) ?? 0) + 1);
      if (Date.now() > deadline && cursor !== '0') {
        truncated = true;
        break;
      }
    } while (cursor !== '0');
    this.prefixCache = {
      at: Date.now(),
      counts: [...counts.entries()]
        .map(([prefix, count]) => ({ prefix, count }))
        .sort((a, b) => b.count - a.count),
      truncated,
    };
    return this.prefixCache;
  }

  async stats(withKeys = true, force = false): Promise<RedisStats> {
    let info: Record<string, string>;
    try {
      info = await this.info();
    } catch {
      return {
        connected: false,
        version: null,
        uptimeSeconds: null,
        usedMemory: null,
        maxMemory: null,
        memoryPercent: null,
        fragmentationRatio: null,
        evictedKeys: null,
        expiredKeys: null,
        keyspaceHits: null,
        keyspaceMisses: null,
        hitRate: null,
        connectedClients: null,
        aofEnabled: null,
        aofLastWriteStatus: null,
        aofLastRewriteStatus: null,
        totalKeys: null,
        keysByPrefix: [],
        keysScannedAt: null,
        keysTruncated: false,
      };
    }
    const used = num(info['used_memory']);
    const max = num(info['maxmemory']);
    const hits = num(info['keyspace_hits']);
    const misses = num(info['keyspace_misses']);
    let totalKeys = 0;
    for (const [name, value] of Object.entries(info)) {
      if (/^db\d+$/.test(name))
        totalKeys += num(/keys=(\d+)/.exec(value)?.[1]) ?? 0;
    }
    const prefixes = withKeys
      ? await this.keysByPrefix(force).catch(() => null)
      : null;
    return {
      connected: true,
      version: info['redis_version'] ?? null,
      uptimeSeconds: num(info['uptime_in_seconds']),
      usedMemory: used,
      maxMemory: max || null,
      memoryPercent:
        used !== null && max ? Math.round((used / max) * 1000) / 10 : null,
      fragmentationRatio: num(info['mem_fragmentation_ratio']),
      evictedKeys: num(info['evicted_keys']),
      expiredKeys: num(info['expired_keys']),
      keyspaceHits: hits,
      keyspaceMisses: misses,
      hitRate:
        hits !== null && misses !== null && hits + misses > 0
          ? Math.round((hits / (hits + misses)) * 1000) / 10
          : null,
      connectedClients: num(info['connected_clients']),
      aofEnabled:
        info['aof_enabled'] === undefined ? null : info['aof_enabled'] === '1',
      aofLastWriteStatus: info['aof_last_write_status'] ?? null,
      aofLastRewriteStatus: info['aof_last_bgrewrite_status'] ?? null,
      totalKeys,
      keysByPrefix: prefixes?.counts ?? [],
      keysScannedAt: prefixes ? new Date(prefixes.at).toISOString() : null,
      keysTruncated: prefixes?.truncated ?? false,
    };
  }
}
