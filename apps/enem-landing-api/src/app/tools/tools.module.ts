import { CacheModule } from '@enem-landing/backend-cache';
import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingModule } from '../tracking/tracking.module.js';
import { DonationOptionEntity } from './donation-option.entity.js';
import { ToolEntity } from './tool.entity.js';
import { ToolsController } from './tools.controller.js';
import { ToolsService } from './tools.service.js';
import { ToolsSettingsEntity } from './tools-settings.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ToolEntity,
      DonationOptionEntity,
      ToolsSettingsEntity,
    ]),
    SsoModule,
    CacheModule,
    TrackingModule,
  ],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
