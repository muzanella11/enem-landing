import { RateLimitModule } from '@enem-landing/backend-rate-limit';
import { RedisModule } from '@enem-landing/backend-redis';
import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CoreModule } from './core.module.js';
import { FeaturesModule } from './features.module.js';
import { HealthModule } from './health/health.module.js';
import { LogsModule } from './logs/logs.module.js';
import { OverviewModule } from './overview/overview.module.js';

/**
 * No database of its own: server logs and metrics come from
 * enem-landing-log-reader, alert history, outbox and samples live in Redis,
 * and MySQL is only read through the PROCESS-only `enem_monitor` user.
 * Every route is SuperAdmin-only through the global guard in AuthModule,
 * except `GET /health` and the alert webhook `POST /hooks/:id`.
 */
@Module({
  imports: [
    RedisModule,
    RateLimitModule,
    AuthModule,
    AuditModule,
    CoreModule,
    HealthModule,
    FeaturesModule,
    OverviewModule,
    LogsModule,
  ],
})
export class AppModule {}
