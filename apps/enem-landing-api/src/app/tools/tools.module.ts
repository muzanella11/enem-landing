import { CacheModule } from '@enem-landing/backend-cache';
import { SchedulerModule } from '@enem-landing/backend-scheduler';
import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingModule } from '../tracking/tracking.module.js';
import { DonationOptionEntity } from './donation-option.entity.js';
import { GoldPriceEntity } from './gold-price.entity.js';
import { GoldPriceService } from './gold-price.service.js';
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
      GoldPriceEntity,
    ]),
    SsoModule,
    CacheModule,
    TrackingModule,
    SchedulerModule,
  ],
  controllers: [ToolsController],
  providers: [ToolsService, GoldPriceService],
})
export class ToolsModule {}
