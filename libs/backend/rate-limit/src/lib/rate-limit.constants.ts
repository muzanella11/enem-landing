export interface RateLimitWindow {
  /** Maximum requests allowed inside one window. */
  limit: number;
  windowMs: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Every backend endpoint falls into one of these tiers. A
 * request must stay under every window of its tier. Values are per client
 * key (the visitor's IP, see `resolveClientKey`).
 */
export const RATE_LIMIT_TIERS = {
  /** Public reads (blog, tools, profile, settings). */
  default: [{ limit: 120, windowMs: MINUTE }],
  /** Public writes without a dedicated tier. */
  write: [{ limit: 20, windowMs: MINUTE }],
  /** Tracker beacons: pageviews, events, clicks, recording chunks. */
  tracking: [{ limit: 300, windowMs: MINUTE }],
  /** Contact form submissions. */
  contact: [
    { limit: 3, windowMs: 10 * MINUTE },
    { limit: 10, windowMs: DAY },
  ],
  /** Captcha challenges and answers. */
  captcha: [
    { limit: 20, windowMs: MINUTE },
    { limit: 200, windowMs: HOUR },
  ],
  /** Sign in, sign up, change password: brute-force targets. */
  auth: [
    { limit: 10, windowMs: MINUTE },
    { limit: 50, windowMs: HOUR },
  ],
  /** Authenticated (CMS/admin) endpoints. */
  admin: [{ limit: 300, windowMs: MINUTE }],
  /** File uploads. */
  upload: [{ limit: 20, windowMs: MINUTE }],
  /**
   * Calls from inside the Docker network that carry no visitor IP
   * (service-to-service, e.g. enem-landing-api's SSO `whoami`). Generous on
   * purpose: one key is shared by every request that service makes.
   */
  internal: [{ limit: 3000, windowMs: MINUTE }],
} satisfies Record<string, RateLimitWindow[]>;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

export const RATE_LIMIT_TIER_METADATA = 'enem-landing:rate-limit-tier';
export const SKIP_RATE_LIMIT_METADATA = 'enem-landing:skip-rate-limit';

/**
 * Multiplies every limit, e.g. for e2e runs that fire many requests from
 * one IP. Production leaves it unset (1).
 */
export const rateLimitMultiplier = (): number => {
  const value = Number(process.env['RATE_LIMIT_MULTIPLIER'] ?? '1');
  return Number.isFinite(value) && value >= 1 ? value : 1;
};

export const rateLimitDisabled = (): boolean =>
  process.env['RATE_LIMIT_DISABLED'] === 'true';
