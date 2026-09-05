import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackingHeatmapService } from './tracking-heatmap.service.js';

describe('TrackingHeatmapService', () => {
  let clickRepo: {
    find: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let aggregateRepo: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };
  let scheduler: {
    createCronJob: ReturnType<typeof vi.fn>;
    runWithLock: ReturnType<typeof vi.fn>;
  };
  let service: TrackingHeatmapService;

  beforeEach(() => {
    clickRepo = {
      find: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    aggregateRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
      update: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
    };
    scheduler = {
      createCronJob: vi.fn(),
      runWithLock: vi.fn((_, task) => task()),
    };
    service = new TrackingHeatmapService(
      clickRepo as never,
      aggregateRepo as never,
      scheduler as never,
    );
  });

  describe('aggregateAndPrune', () => {
    it('groups multiple clicks in the same grid cell into one row with an incremented count, not separate rows', async () => {
      clickRepo.find.mockResolvedValue([
        // Grid cell size is 1/20 = 0.05 - both of these land in cell (0,0).
        {
          path: '/',
          xPct: 0.01,
          yPct: 0.02,
          deviceBucket: 'desktop',
          occurredAt: new Date(),
        },
        {
          path: '/',
          xPct: 0.03,
          yPct: 0.01,
          deviceBucket: 'desktop',
          occurredAt: new Date(),
        },
        {
          path: '/',
          xPct: 0.9,
          yPct: 0.9,
          deviceBucket: 'desktop',
          occurredAt: new Date(),
        },
      ]);

      await service.aggregateAndPrune();

      // Two distinct grid cells: (0,0) hit twice, (18,18) hit once.
      expect(aggregateRepo.save).toHaveBeenCalledTimes(2);
      expect(aggregateRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ gridX: 0, gridY: 0, count: 2 }),
      );
      expect(aggregateRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ gridX: 18, gridY: 18, count: 1 }),
      );
    });

    it('increments an existing aggregate row instead of creating a duplicate', async () => {
      aggregateRepo.findOne.mockResolvedValue({
        id: 'agg-1',
        path: '/',
        deviceBucket: 'desktop',
        gridX: 0,
        gridY: 0,
        count: 5,
      });
      clickRepo.find.mockResolvedValue([
        {
          path: '/',
          xPct: 0.01,
          yPct: 0.01,
          deviceBucket: 'desktop',
          occurredAt: new Date(),
        },
      ]);

      await service.aggregateAndPrune();

      expect(aggregateRepo.update).toHaveBeenCalledWith('agg-1', { count: 6 });
      expect(aggregateRepo.save).not.toHaveBeenCalled();
    });

    it('clamps xPct/yPct of exactly 1 into the last grid cell instead of overflowing it', async () => {
      clickRepo.find.mockResolvedValue([
        {
          path: '/',
          xPct: 1,
          yPct: 1,
          deviceBucket: 'desktop',
          occurredAt: new Date(),
        },
      ]);

      await service.aggregateAndPrune();

      expect(aggregateRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ gridX: 19, gridY: 19 }),
      );
    });

    it('deletes the raw rows it just processed', async () => {
      const rawRows = [
        {
          path: '/',
          xPct: 0.5,
          yPct: 0.5,
          deviceBucket: 'desktop',
          occurredAt: new Date(),
        },
      ];
      clickRepo.find.mockResolvedValue(rawRows);

      await service.aggregateAndPrune();

      expect(clickRepo.remove).toHaveBeenCalledWith(rawRows);
    });

    it('does nothing when there are no raw clicks', async () => {
      clickRepo.find.mockResolvedValue([]);
      await service.aggregateAndPrune();
      expect(clickRepo.remove).not.toHaveBeenCalled();
      expect(aggregateRepo.save).not.toHaveBeenCalled();
    });
  });

  it('triggerNow runs through the scheduler lock under the same task id as the cron job', async () => {
    await service.triggerNow();
    expect(scheduler.runWithLock).toHaveBeenCalledWith(
      'tracking-click-aggregation',
      expect.any(Function),
    );
  });

  it('getHeatmap queries aggregates by path and deviceBucket', async () => {
    await service.getHeatmap('/', 'desktop');
    expect(aggregateRepo.find).toHaveBeenCalledWith({
      where: { path: '/', deviceBucket: 'desktop' },
    });
  });
});
