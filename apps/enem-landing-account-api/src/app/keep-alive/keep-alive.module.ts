import { SchedulerModule } from '@enem-landing/backend-scheduler';
import { Module } from '@nestjs/common';
import { KeepAliveService } from './keep-alive.service.js';

@Module({
  imports: [SchedulerModule],
  providers: [KeepAliveService],
})
export class KeepAliveModule {}
