import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import cronstrue from 'cronstrue';
import moment from 'moment-timezone';

/**
 * Ported from mau-apps (`libs/backend/scheduler/src/lib/scheduler.service.ts`).
 * Dynamic cron job registry on top of @nestjs/schedule's SchedulerRegistry.
 * Unlike the static @Cron() decorator, jobs here can be created, replaced, and
 * removed at runtime, and every job is wrapped with a per-taskId lock so a
 * slow run is skipped rather than overlapping with the next tick.
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly cronLocks = new Map<string, boolean>();

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  async runWithLock(taskId: string, task: () => Promise<void>): Promise<void> {
    if (this.cronLocks.get(taskId)) {
      this.logger.warn(
        `Task ${taskId} is still running, skipping this tick to prevent overlap`,
      );
      return;
    }

    this.cronLocks.set(taskId, true);
    const startedAt = Date.now();

    try {
      await task();
      this.logger.log(
        `Task ${taskId} completed in ${(Date.now() - startedAt) / 1000}s`,
      );
    } catch (error) {
      this.logger.error(
        `Task ${taskId} failed after ${(Date.now() - startedAt) / 1000}s`,
        error,
      );
      throw error;
    } finally {
      this.cronLocks.set(taskId, false);
    }
  }

  cronDescription(cronExpression: string): string {
    return cronstrue.toString(cronExpression, {
      throwExceptionOnParseError: false,
      use24HourTimeFormat: true,
      monthStartIndexZero: true,
      dayOfWeekStartIndexZero: true,
    });
  }

  isTaskRunning(taskId: string): boolean {
    return this.cronLocks.get(taskId) === true;
  }

  getRunningTasks(): string[] {
    return Array.from(this.cronLocks.entries())
      .filter(([, isRunning]) => isRunning)
      .map(([taskId]) => taskId);
  }

  getAllTasksStatus(): Map<string, boolean> {
    return new Map(this.cronLocks);
  }

  // Emergency use only: clears a lock that got stuck (e.g. process crashed mid-task).
  forceReleaseLock(taskId: string): void {
    this.logger.warn(`Force releasing lock for task ${taskId}`);
    this.cronLocks.set(taskId, false);
  }

  getAllCronJobs(): Map<string, CronJob> {
    return this.schedulerRegistry.getCronJobs();
  }

  getCronJobById(taskId: string): CronJob | undefined {
    try {
      return this.schedulerRegistry.getCronJob(taskId);
    } catch {
      return undefined;
    }
  }

  logExistingJobs(): void {
    const jobs = this.getAllCronJobs();

    if (jobs.size === 0) {
      this.logger.log('No jobs currently scheduled');
      return;
    }

    const entries = Array.from(jobs.entries())
      .map(([id, job]) => ({
        taskId: id,
        nextRun: job.nextDate().toJSDate().toISOString(),
        schedule: this.cronDescription(job.cronTime.source.toString()),
        timeZone: job.cronTime.timeZone || 'UTC',
      }))
      .sort(
        (a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime(),
      );

    this.logger.log(
      `Scheduled jobs (${entries.length}): ${entries.map((entry) => entry.taskId).join(', ')}`,
    );
    console.table(entries);
  }

  // Creates and starts a cron job for `taskId`, replacing any existing job with the same id.
  // `timeZone` should be an IANA name (e.g. "Asia/Jakarta"); it defaults to the server's local
  // time zone when omitted.
  createCronJob(
    taskId: string,
    cronExpression: string,
    task: () => Promise<void>,
    timeZone?: string,
  ): void {
    if (this.getCronJobById(taskId)) {
      this.deleteCronJob(taskId);
    }

    const job = new CronJob(
      cronExpression,
      () => this.runWithLock(taskId, task),
      null,
      true,
      timeZone,
    );

    this.schedulerRegistry.addCronJob(taskId, job);
    job.start();

    this.logger.log(
      `Job ${taskId} scheduled: ${this.cronDescription(cronExpression)} (${timeZone ?? 'server default'})`,
    );
    this.logExistingJobs();
  }

  updateCronJob(
    taskId: string,
    cronExpression: string,
    task: () => Promise<void>,
    timeZone?: string,
  ): void {
    this.createCronJob(taskId, cronExpression, task, timeZone);
  }

  // Schedules a one-off run of `task` at `runAt`. Does nothing if `runAt` is already in the
  // past. Runs through the same per-taskId lock as recurring jobs.
  scheduleOneOffJob(
    taskId: string,
    task: () => Promise<void>,
    runAt: Date | string,
    timeZone = 'UTC',
  ): void {
    const oneOffTaskId = `${taskId}-once`;
    const target = moment.tz(runAt, timeZone);

    if (!target.isAfter(moment())) {
      this.logger.warn(
        `One-off job ${oneOffTaskId} skipped: ${target.toISOString()} is not in the future`,
      );
      return;
    }

    if (this.getCronJobById(oneOffTaskId)) {
      this.deleteCronJob(oneOffTaskId);
    }

    const cronExpression = target.format('s m H D M');
    const job = new CronJob(
      cronExpression,
      () =>
        this.runWithLock(oneOffTaskId, task).finally(() =>
          this.deleteCronJob(oneOffTaskId),
        ),
      null,
      true,
      timeZone,
    );

    this.schedulerRegistry.addCronJob(oneOffTaskId, job);
    job.start();

    this.logger.log(
      `One-off job ${oneOffTaskId} scheduled at ${target.toISOString()} (${timeZone})`,
    );
    this.logExistingJobs();
  }

  deleteCronJob(taskId: string): void {
    const job = this.getCronJobById(taskId);

    if (!job) {
      this.logger.warn(`Job ${taskId} not found, nothing to delete`);
      return;
    }

    job.stop();
    this.schedulerRegistry.deleteCronJob(taskId);
    this.logger.log(`Job ${taskId} deleted`);
  }
}
