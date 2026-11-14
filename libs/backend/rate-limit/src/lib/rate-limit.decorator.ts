import { SetMetadata } from '@nestjs/common';
import {
  RATE_LIMIT_TIER_METADATA,
  type RateLimitTier,
  SKIP_RATE_LIMIT_METADATA,
} from './rate-limit.constants.js';

/** Puts a controller or route into a specific rate-limit tier. */
export const RateLimit = (tier: RateLimitTier) =>
  SetMetadata(RATE_LIMIT_TIER_METADATA, tier);

/** Exempts a controller or route from rate limiting (health checks). */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_METADATA, true);
