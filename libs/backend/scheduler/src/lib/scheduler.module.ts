import { Module } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service.js';

@Module({
  providers: [SchedulerService, SchedulerRegistry],
  exports: [SchedulerService],
})
export class SchedulerModule {}
