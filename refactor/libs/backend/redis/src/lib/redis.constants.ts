export const redisHost = process.env['REDIS_HOST'] || 'localhost';
export const redisPort = parseInt(process.env['REDIS_PORT'] || '6379', 10);
export const redisUsername = process.env['REDIS_USERNAME'] || '';
export const redisPassword = process.env['REDIS_PASSWORD'] || '';
export const redisDB = parseInt(process.env['REDIS_DB'] || '0', 10);

/** Upstash (and most managed Redis) requires TLS; self-hosted dev usually doesn't. */
export const redisTLSEnabled = process.env['REDIS_TLS_ENABLED'] === 'true';

/**
 * Optional key prefix for environment isolation when dev/prod share one
 * Redis instance (e.g. a free-tier Upstash database) — same pattern as
 * mau-apps (`libs/backend/redis/src/lib/redis.constants.ts`). Empty by
 * default (no prefix, single-environment self-hosted Redis).
 */
export const redisKeyPrefix = process.env['REDIS_KEY_PREFIX'] || '';
