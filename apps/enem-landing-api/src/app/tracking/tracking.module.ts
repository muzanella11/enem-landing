import { CacheModule } from '@enem-landing/backend-cache';
import { SchedulerModule } from '@enem-landing/backend-scheduler';
import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller.js';
import { TrackingClickAggregateEntity } from './tracking-click-aggregate.entity.js';
import { TrackingClickEntity } from './tracking-click.entity.js';
import { TrackingEventEntity } from './tracking-event.entity.js';
import { TrackingFunnelEntity } from './tracking-funnel.entity.js';
import { TrackingFunnelsService } from './tracking-funnels.service.js';
import { TrackingHeatmapService } from './tracking-heatmap.service.js';
import { TrackingPageviewEntity } from './tracking-pageview.entity.js';
import { TrackingRecordingChunkEntity } from './tracking-recording-chunk.entity.js';
import { TrackingRecordingService } from './tracking-recording.service.js';
import { TrackingService } from './tracking.service.js';
import { TrackingSessionEntity } from './tracking-session.entity.js';
import { TrackingSettingsEntity } from './tracking-settings.entity.js';
import { TrackingSettingsService } from './tracking-settings.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrackingSettingsEntity,
      TrackingSessionEntity,
      TrackingPageviewEntity,
      TrackingEventEntity,
      TrackingFunnelEntity,
      TrackingClickEntity,
      TrackingClickAggregateEntity,
      TrackingRecordingChunkEntity,
    ]),
    SsoModule,
    CacheModule,
    SchedulerModule,
  ],
  controllers: [TrackingController],
  providers: [
    TrackingService,
    TrackingSettingsService,
    TrackingFunnelsService,
    TrackingHeatmapService,
    TrackingRecordingService,
  ],
})
export class TrackingModule {}
