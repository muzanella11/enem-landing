import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulerService } from './scheduler.service.js';

describe('SchedulerService', () => {
  let schedulerRegistry: {
    getCronJobs: ReturnType<typeof vi.fn>;
    getCronJob: ReturnType<typeof vi.fn>;
    deleteCronJob: ReturnType<typeof vi.fn>;
  };
  let service: SchedulerService;

  beforeEach(() => {
    schedulerRegistry = {
      getCronJobs: vi.fn().mockReturnValue(new Map()),
      getCronJob: vi.fn(),
      deleteCronJob: vi.fn(),
    };
    service = new SchedulerService(schedulerRegistry as never);
  });

  describe('runWithLock', () => {
    it('runs the task and releases the lock afterwards', async () => {
      const task = vi.fn().mockResolvedValue(undefined);

      await service.runWithLock('task-1', task);

      expect(task).toHaveBeenCalledOnce();
      expect(service.isTaskRunning('task-1')).toBe(false);
    });

    it('skips a tick instead of overlapping when the task is still running', async () => {
      let releaseFirstRun!: () => void;
      const firstRun = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            releaseFirstRun = resolve;
          }),
      );
      const secondRun = vi.fn().mockResolvedValue(undefined);

      const firstCall = service.runWithLock('task-1', firstRun);
      expect(service.isTaskRunning('task-1')).toBe(true);

      await service.runWithLock('task-1', secondRun);
      expect(secondRun).not.toHaveBeenCalled();

      releaseFirstRun();
      await firstCall;
      expect(service.isTaskRunning('task-1')).toBe(false);
    });

    it('releases the lock and rethrows when the task fails', async () => {
      const task = vi.fn().mockRejectedValue(new Error('boom'));

      await expect(service.runWithLock('task-1', task)).rejects.toThrow('boom');
      expect(service.isTaskRunning('task-1')).toBe(false);
    });

    it('tracks running tasks independently by taskId', async () => {
      let release!: () => void;
      const blocked = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );

      const call = service.runWithLock('task-a', blocked);
      expect(service.getRunningTasks()).toEqual(['task-a']);
      expect(service.getAllTasksStatus().get('task-a')).toBe(true);

      release();
      await call;
      expect(service.getRunningTasks()).toEqual([]);
    });
  });

  describe('forceReleaseLock', () => {
    it('clears a stuck lock', async () => {
      let release!: () => void;
      const blocked = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );
      const call = service.runWithLock('task-1', blocked);
      expect(service.isTaskRunning('task-1')).toBe(true);

      service.forceReleaseLock('task-1');
      expect(service.isTaskRunning('task-1')).toBe(false);

      release();
      await call;
    });
  });

  describe('cronDescription', () => {
    it('translates a cron expression into a human-readable description', () => {
      expect(service.cronDescription('0 * * * *')).toBe('Every hour');
    });
  });

  describe('getCronJobById', () => {
    it('returns the job from the registry', () => {
      const job = { stop: vi.fn() };
      schedulerRegistry.getCronJob.mockReturnValue(job);

      expect(service.getCronJobById('task-1')).toBe(job);
    });

    it('returns undefined instead of throwing when the job is not registered', () => {
      schedulerRegistry.getCronJob.mockImplementation(() => {
        throw new Error('not found');
      });

      expect(service.getCronJobById('missing')).toBeUndefined();
    });
  });

  describe('deleteCronJob', () => {
    it('stops the job and removes it from the registry', () => {
      const job = { stop: vi.fn() };
      schedulerRegistry.getCronJob.mockReturnValue(job);

      service.deleteCronJob('task-1');

      expect(job.stop).toHaveBeenCalledOnce();
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('task-1');
    });

    it('does nothing when the job does not exist', () => {
      schedulerRegistry.getCronJob.mockImplementation(() => {
        throw new Error('not found');
      });

      service.deleteCronJob('missing');

      expect(schedulerRegistry.deleteCronJob).not.toHaveBeenCalled();
    });
  });
});
