import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { apiHost } from '../monitor.config.js';
import { DbStatsService } from './db-stats.service.js';
import { RedisStatsService } from './redis-stats.service.js';

const ok = (data: unknown) => successResponse(HttpStatus.OK, 'Success', data);

/**
 * Calls enem-landing-api's own `/cache` endpoints (which own the cache
 * keys) with the SuperAdmin's token, so the API checks the role itself.
 */
const callApiCache = async (
  req: Request,
  method: 'GET' | 'DELETE',
  key?: string,
) => {
  const url = new URL('/cache', apiHost());
  if (key) url.searchParams.set('key', key);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { Authorization: req.headers.authorization ?? '' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new HttpException(
      'enem-landing-api is unreachable',
      HttpStatus.BAD_GATEWAY,
    );
  }
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    data?: unknown;
  };
  if (!response.ok) {
    throw new HttpException(
      body.message ?? 'Cache request failed',
      response.status,
    );
  }
  return body.data;
};

@RateLimit('admin')
@Controller()
export class DbController {
  constructor(
    private readonly db: DbStatsService,
    private readonly redisStats: RedisStatsService,
  ) {}

  @Get('db/stats')
  async stats() {
    return ok(await this.db.stats());
  }

  @Get('db/sizes')
  async sizes() {
    return ok(await this.db.sizes());
  }

  @Get('db/slow-patterns')
  async slowPatterns() {
    return ok(await this.db.slowPatterns());
  }

  @Get('redis/stats')
  async redis(@Query('refresh') refresh?: string) {
    return ok(await this.redisStats.stats(true, refresh === 'true'));
  }

  @Get('cache')
  async cache(@Req() req: Request) {
    return ok(await callApiCache(req, 'GET'));
  }

  @Delete('cache')
  async flushCache(@Req() req: Request, @Query('key') key?: string) {
    if (!key || !/^[a-z0-9:_-]{1,100}$/i.test(key))
      throw new BadRequestException('Invalid cache key');
    return ok(await callApiCache(req, 'DELETE', key));
  }
}
