import { RedisService } from '@enem-landing/backend-redis';
import { SchedulerService } from '@enem-landing/backend-scheduler';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { SystemSettingsService } from '../system-settings/system-settings.service.js';

const TASK_ID = 'keep-alive-db-and-redis';
const TIME_ZONE_SETTING_KEY = 'KEEP_ALIVE_CRON_TIME_ZONE';

// Twice a day, at 00:00 and 12:00 in whatever time zone is resolved.
const CRON_EXPRESSION = '0 0,12 * * *';

/**
 * Free-tier DB/Redis providers suspend an instance after a period of
 * inactivity. This runs a trivial query/command on both on a fixed schedule
 * so neither connection stays idle long enough to be paused.
 */
@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly schedulerService: SchedulerService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  // The time zone is read once at boot - editing it from enem-landing-cms's
  // settings page (system_settings, falling back to the
  // KEEP_ALIVE_CRON_TIME_ZONE env var, then UTC) takes effect on next
  // restart.
  async onModuleInit(): Promise<void> {
    const timeZone =
      (await this.systemSettingsService.get(TIME_ZONE_SETTING_KEY)) || 'UTC';

    this.schedulerService.createCronJob(
      TASK_ID,
      CRON_EXPRESSION,
      () => this.pingDatabaseAndRedis(),
      timeZone,
    );
  }

  private async pingDatabaseAndRedis(): Promise<void> {
    await this.dataSource.query('SELECT 1');
    this.logger.log('Database ping succeeded');

    await this.redisService.ping();
    this.logger.log('Redis ping succeeded');
  }
}
