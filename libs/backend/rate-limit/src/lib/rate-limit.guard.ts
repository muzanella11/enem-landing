import { RedisService } from '@enem-landing/backend-redis';
import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { maskClientKey, resolveClientKey } from './client-key.js';
import {
  RATE_LIMIT_TIER_METADATA,
  RATE_LIMIT_TIERS,
  rateLimitDisabled,
  rateLimitMultiplier,
  type RateLimitTier,
  SKIP_RATE_LIMIT_METADATA,
} from './rate-limit.constants.js';

/** Nest's own key for `@UseGuards()` metadata (`GUARDS_METADATA`). */
const GUARDS_METADATA = '__guards__';

/**
 * Global guard: every route of an app that imports
 * `RateLimitModule` is limited, so a new endpoint is never left open.
 *
 * Tier: an explicit `@RateLimit()` wins; otherwise a route with its own
 * auth guard is `admin`, a GET/HEAD is `default`, and anything else is
 * `write`. Calls with a valid `X-Internal-Api-Key` and `@SkipRateLimit()`
 * routes are not counted.
 *
 * Fails open: if Redis is unreachable the request goes through (with a
 * warning), so a cache outage can't take the whole site down.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http' || rateLimitDisabled()) return true;

    const targets = [context.getHandler(), context.getClass()];
    if (
      this.reflector.getAllAndOverride<boolean>(
        SKIP_RATE_LIMIT_METADATA,
        targets,
      )
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (this.hasValidInternalKey(request)) return true;

    const client = resolveClientKey({
      ip: request.ip,
      forwardedFor: request.headers['x-forwarded-for'],
    });
    const tier: RateLimitTier = client.internal
      ? 'internal'
      : this.resolveTier(context, request);

    const multiplier = rateLimitMultiplier();
    for (const window of RATE_LIMIT_TIERS[tier]) {
      const limit = Math.floor(window.limit * multiplier);
      let result: { count: number; ttlMs: number };
      try {
        result = await this.redisService.incrementWindow(
          `rate-limit:${tier}:${window.windowMs}:${client.key}`,
          window.windowMs,
        );
      } catch (error) {
        this.logger.warn(
          `Rate limit store unavailable, allowing request: ${String(error)}`,
        );
        return true;
      }

      if (result.count > limit) {
        const retryAfterSeconds = Math.max(1, Math.ceil(result.ttlMs / 1000));
        context
          .switchToHttp()
          .getResponse<Response>()
          .setHeader('Retry-After', String(retryAfterSeconds));
        this.logger.warn(
          `Rate limit hit tier=${tier} route=${request.method} ${request.route?.path ?? request.path} key=${maskClientKey(client.key)}`,
        );
        throw new HttpException(
          'Too many requests, please try again later',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  private resolveTier(
    context: ExecutionContext,
    request: Request,
  ): RateLimitTier {
    const targets = [context.getHandler(), context.getClass()];
    const explicit = this.reflector.getAllAndOverride<
      RateLimitTier | undefined
    >(RATE_LIMIT_TIER_METADATA, targets);
    if (explicit) return explicit;

    const guards = targets.flatMap(
      (target) =>
        this.reflector.get<unknown[] | undefined>(GUARDS_METADATA, target) ??
        [],
    );
    if (guards.length > 0) return 'admin';

    return request.method === 'GET' || request.method === 'HEAD'
      ? 'default'
      : 'write';
  }

  private hasValidInternalKey(request: Request): boolean {
    const expected = process.env['INTERNAL_API_KEY'];
    return (
      Boolean(expected) && request.headers['x-internal-api-key'] === expected
    );
  }
}
