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
  PUBLIC_TRACKING_CONFIG_TOOLS: 'cache:public:tracking-config:tools',
  PUBLIC_TOOLS_CONFIG: 'cache:public:tools-config',
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
  [CACHE_KEYS.PUBLIC_TRACKING_CONFIG_TOOLS]: 60,
  // Tool registry, ad switches, and donation options for enem-landing-tools
  // (Story 25). Short so a CMS change shows up within minutes even if an
  // invalidation is missed; the tools app adds its own SWR cache on top.
  [CACHE_KEYS.PUBLIC_TOOLS_CONFIG]: 300,
};

/** `landing` keeps the original key so existing cache stats stay meaningful. */
export const TRACKING_CONFIG_CACHE_KEY_BY_SITE = {
  landing: CACHE_KEYS.PUBLIC_TRACKING_CONFIG,
  tools: CACHE_KEYS.PUBLIC_TRACKING_CONFIG_TOOLS,
} as const;
