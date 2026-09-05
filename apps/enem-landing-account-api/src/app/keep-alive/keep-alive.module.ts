import { SchedulerModule } from '@enem-landing/backend-scheduler';
import { Module } from '@nestjs/common';
import { SystemSettingsModule } from '../system-settings/system-settings.module.js';
import { KeepAliveService } from './keep-alive.service.js';

@Module({
  imports: [SchedulerModule, SystemSettingsModule],
  providers: [KeepAliveService],
})
export class KeepAliveModule {}
