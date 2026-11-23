import { Module } from '@nestjs/common';
import { AlertsController } from './alerts/alerts.controller.js';
import { HooksController } from './alerts/hooks.controller.js';
import { DbController } from './db/db.controller.js';
import { DeployController } from './deploy/deploy.controller.js';
import { MetricsController } from './metrics/metrics.controller.js';
import { SecurityController } from './security/security.controller.js';
import { UptimeController } from './uptime/uptime.controller.js';

@Module({
  controllers: [
    AlertsController,
    HooksController,
    MetricsController,
    UptimeController,
    SecurityController,
    DbController,
    DeployController,
  ],
})
export class FeaturesModule {}
