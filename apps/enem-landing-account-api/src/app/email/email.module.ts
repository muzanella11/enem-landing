import { Module } from '@nestjs/common';
import { SystemSettingsModule } from '../system-settings/system-settings.module.js';
import { EmailController } from './email.controller.js';
import { EmailService } from './email.service.js';

@Module({
  imports: [SystemSettingsModule],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
