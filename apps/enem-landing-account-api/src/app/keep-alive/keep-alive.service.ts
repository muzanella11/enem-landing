import { RedisService } from '@enem-landing/backend-redis';
import { SchedulerService } from '@enem-landing/backend-scheduler';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';

const TASK_ID = 'keep-alive-db-and-redis';

// Twice a day, at 00:00 and 12:00 UTC.
const CRON_EXPRESSION = '0 0,12 * * *';
const TIME_ZONE = 'UTC';

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
  ) {}

  onModuleInit(): void {
    this.schedulerService.createCronJob(
      TASK_ID,
      CRON_EXPRESSION,
      () => this.pingDatabaseAndRedis(),
      TIME_ZONE,
    );
  }

  private async pingDatabaseAndRedis(): Promise<void> {
    await this.dataSource.query('SELECT 1');
    this.logger.log('Database ping succeeded');

    await this.redisService.ping();
    this.logger.log('Redis ping succeeded');
  }
}
