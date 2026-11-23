import { SchedulerModule } from '@enem-landing/backend-scheduler';
import { Global, Module } from '@nestjs/common';
import { AlertEngine } from './alerts/alert-engine.service.js';
import { AlertMailer } from './alerts/alert-mailer.js';
import { AlertOutbox } from './alerts/alert-outbox.js';
import { AlertService } from './alerts/alert.service.js';
import { DbStatsService } from './db/db-stats.service.js';
import { RedisStatsService } from './db/redis-stats.service.js';
import { DeployService } from './deploy/deploy.service.js';
import { LogReaderClient } from './logs/log-reader.client.js';
import { MetricsService } from './metrics/metrics.service.js';
import { SecurityService } from './security/security.service.js';
import { MonitorStore } from './store/monitor-store.js';
import { UptimeService } from './uptime/uptime.service.js';

const SERVICES = [
  MonitorStore,
  LogReaderClient,
  AlertMailer,
  AlertOutbox,
  AlertService,
  MetricsService,
  UptimeService,
  SecurityService,
  DbStatsService,
  RedisStatsService,
  DeployService,
];

/**
 * Services shared by every menu, plus the per-minute AlertEngine that
 * reads them all. Controllers live in FeaturesModule.
 */
@Global()
@Module({
  imports: [SchedulerModule],
  providers: [...SERVICES, AlertEngine],
  exports: SERVICES,
})
export class CoreModule {}
