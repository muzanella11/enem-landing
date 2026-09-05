import { SchedulerService } from '@enem-landing/backend-scheduler';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingClickAggregateEntity } from './tracking-click-aggregate.entity.js';
import { TrackingClickEntity } from './tracking-click.entity.js';

const TASK_ID = 'tracking-click-aggregation';
const CRON_EXPRESSION = '0 * * * *'; // hourly, on the hour
const GRID_SIZE = 20;

interface AggregateGroup {
  path: string;
  deviceBucket: string;
  gridX: number;
  gridY: number;
  count: number;
}

/**
 * Rolls up raw `tracking_clicks` rows into a `gridSize x gridSize` grid
 * per (path, deviceBucket), then deletes the raw rows it just processed -
 * so the raw table never grows unbounded regardless of how long tracking
 * has been running. Simpler than keeping a separate retention window: a
 * row is aggregated and removed in the same pass, never lingering
 * unaggregated.
 */
@Injectable()
export class TrackingHeatmapService implements OnModuleInit {
  private readonly logger = new Logger(TrackingHeatmapService.name);

  constructor(
    @InjectRepository(TrackingClickEntity)
    private readonly clickRepository: Repository<TrackingClickEntity>,
    @InjectRepository(TrackingClickAggregateEntity)
    private readonly aggregateRepository: Repository<TrackingClickAggregateEntity>,
    private readonly schedulerService: SchedulerService,
  ) {}

  onModuleInit(): void {
    this.schedulerService.createCronJob(TASK_ID, CRON_EXPRESSION, () =>
      this.aggregateAndPrune(),
    );
  }

  /** Manual trigger (e.g. for testing/an admin "run now" action) - shares the same lock key as the cron job, so the two can never run concurrently either. */
  triggerNow(): Promise<void> {
    return this.schedulerService.runWithLock(TASK_ID, () =>
      this.aggregateAndPrune(),
    );
  }

  getHeatmap(
    path: string,
    deviceBucket: string,
  ): Promise<TrackingClickAggregateEntity[]> {
    return this.aggregateRepository.find({ where: { path, deviceBucket } });
  }

  async getDistinctPaths(): Promise<string[]> {
    const rows = await this.aggregateRepository
      .createQueryBuilder('aggregate')
      .select('DISTINCT aggregate.path', 'path')
      .getRawMany<{ path: string }>();
    return rows.map((row) => row.path);
  }

  private clampGrid(value: number): number {
    return Math.min(GRID_SIZE - 1, Math.max(0, value));
  }

  async aggregateAndPrune(): Promise<void> {
    const rawClicks = await this.clickRepository.find();
    if (rawClicks.length === 0) return;

    const grouped = new Map<string, AggregateGroup>();
    for (const click of rawClicks) {
      const gridX = this.clampGrid(Math.floor(click.xPct * GRID_SIZE));
      const gridY = this.clampGrid(Math.floor(click.yPct * GRID_SIZE));
      const key = `${click.path}::${click.deviceBucket}::${gridX}::${gridY}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(key, {
          path: click.path,
          deviceBucket: click.deviceBucket,
          gridX,
          gridY,
          count: 1,
        });
      }
    }

    for (const group of grouped.values()) {
      const existingAggregate = await this.aggregateRepository.findOne({
        where: {
          path: group.path,
          deviceBucket: group.deviceBucket,
          gridX: group.gridX,
          gridY: group.gridY,
        },
      });

      if (existingAggregate) {
        await this.aggregateRepository.update(existingAggregate.id, {
          count: existingAggregate.count + group.count,
        });
      } else {
        await this.aggregateRepository.save(
          this.aggregateRepository.create(group),
        );
      }
    }

    await this.clickRepository.remove(rawClicks);
    this.logger.log(
      `Aggregated ${rawClicks.length} raw clicks into ${grouped.size} grid cells`,
    );
  }
}
