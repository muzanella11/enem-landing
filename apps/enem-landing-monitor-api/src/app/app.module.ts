import { RateLimitModule } from '@enem-landing/backend-rate-limit';
import { RedisModule } from '@enem-landing/backend-redis';
import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { LogsModule } from './logs/logs.module.js';
import { OverviewModule } from './overview/overview.module.js';

/**
 * No database: this app only reads (server logs via enem-landing-log-reader,
 * Redis stats). Every route is SuperAdmin-only through the global guard in
 * AuthModule, except `GET /health`.
 */
@Module({
  imports: [
    RedisModule,
    RateLimitModule,
    AuthModule,
    AuditModule,
    HealthModule,
    OverviewModule,
    LogsModule,
  ],
})
export class AppModule {}
