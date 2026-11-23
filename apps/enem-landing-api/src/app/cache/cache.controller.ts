import { successResponse } from '@enem-landing/backend-utils';
import { RedisService } from '@enem-landing/backend-redis';
import { CacheService } from '@enem-landing/backend-cache';
import { assertSuperAdminRole, SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Query,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { CACHE_KEYS, type CacheKey } from './cache.constants.js';

const ALL_KEYS = Object.values(CACHE_KEYS) as CacheKey[];

/**
 * Operational, so SuperAdmin-only: called by enem-landing-monitor-api (the
 * monitor's Redis > Cache tab) with the SuperAdmin's own token. The CMS no
 * longer has a Cache page.
 */
@Controller('cache')
@UseGuards(SsoAuthGuard)
export class CacheController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    assertSuperAdminRole((req as Request & { user: User }).user);

    try {
      await this.redisService.ping();
    } catch {
      return successResponse(HttpStatus.OK, 'Success', {
        connected: false,
        keys: [],
      });
    }

    const keys = await Promise.all(
      ALL_KEYS.map((key) => this.cacheService.getEntry(key)),
    );
    return successResponse(HttpStatus.OK, 'Success', { connected: true, keys });
  }

  @Delete()
  async flush(@Req() req: Request, @Query('key') key?: string) {
    assertSuperAdminRole((req as Request & { user: User }).user);

    if (key === 'all') {
      await this.cacheService.invalidate(...ALL_KEYS);
    } else if (key && (ALL_KEYS as string[]).includes(key)) {
      await this.cacheService.invalidate(key);
    } else {
      throw new BadRequestException('Unknown cache key');
    }

    return successResponse(HttpStatus.OK, 'Success', { ok: true });
  }
}
