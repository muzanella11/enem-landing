import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard.js';

/**
 * Registers `RateLimitGuard` globally. Needs `RedisModule`
 * (global) imported by the app.
 */
@Module({
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class RateLimitModule {}
