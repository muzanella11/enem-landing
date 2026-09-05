/**
 * Cache keys for enem-landing-api's public GET endpoints, plus how long
 * each is kept before it's recomputed. All three back low-churn content
 * only ever changed from enem-landing-cms, which invalidates the matching
 * key right after a write.
 */
export const CACHE_KEYS = {
  PUBLIC_EXPERIENCES: 'cache:public:experiences',
  PUBLIC_SITE_PROFILE: 'cache:public:site-profile',
  PUBLIC_SKILLS: 'cache:public:skills',
  PUBLIC_TRACKING_CONFIG: 'cache:public:tracking-config',
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

export const CACHE_TTL_SECONDS: Record<CacheKey, number> = {
  [CACHE_KEYS.PUBLIC_EXPERIENCES]: 1800,
  [CACHE_KEYS.PUBLIC_SITE_PROFILE]: 1800,
  [CACHE_KEYS.PUBLIC_SKILLS]: 1800,
  // Short on purpose: a CMS toggle flip needs to reach the public tracker
  // quickly, and this payload is tiny so the extra DB reads on expiry cost
  // nothing.
  [CACHE_KEYS.PUBLIC_TRACKING_CONFIG]: 60,
};
