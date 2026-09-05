import { SchedulerService } from '@enem-landing/backend-scheduler';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';

const TASK_ID = 'keep-alive-db';

// Twice a day, at 00:00 and 12:00 UTC.
const CRON_EXPRESSION = '0 0,12 * * *';
const TIME_ZONE = process.env['KEEP_ALIVE_CRON_TIME_ZONE'] || 'UTC';

/**
 * Free-tier DB providers (PlanetScale, Railway, etc.) suspend a database
 * after a period of inactivity. This runs a trivial query on a fixed
 * schedule so the connection stays active and the instance never goes idle
 * long enough to be paused.
 */
@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly schedulerService: SchedulerService,
  ) {}

  onModuleInit(): void {
    this.schedulerService.createCronJob(
      TASK_ID,
      CRON_EXPRESSION,
      () => this.pingDatabase(),
      TIME_ZONE,
    );
  }

  private async pingDatabase(): Promise<void> {
    await this.dataSource.query('SELECT 1');
    this.logger.log('Database ping succeeded');
  }
}
