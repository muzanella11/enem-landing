import { RedisModule } from '@enem-landing/backend-redis';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheAdminModule } from './cache/cache-admin.module.js';
import { ContactSubmissionEntity } from './contact-submissions/contact-submission.entity.js';
import { ContactSubmissionsModule } from './contact-submissions/contact-submissions.module.js';
import { ExperienceEntity } from './experiences/experience.entity.js';
import { ExperiencesModule } from './experiences/experiences.module.js';
import { ProjectEntity } from './experiences/project.entity.js';
import { HealthModule } from './health/health.module.js';
import { SeoMetaEntity } from './seo-meta/seo-meta.entity.js';
import { SeoMetaModule } from './seo-meta/seo-meta.module.js';
import { SiteProfileEntity } from './site-profile/site-profile.entity.js';
import { SiteProfileModule } from './site-profile/site-profile.module.js';
import { SkillEntity } from './skills/skill.entity.js';
import { SkillsModule } from './skills/skills.module.js';
import { TrackingClickAggregateEntity } from './tracking/tracking-click-aggregate.entity.js';
import { TrackingClickEntity } from './tracking/tracking-click.entity.js';
import { TrackingEventEntity } from './tracking/tracking-event.entity.js';
import { TrackingFunnelEntity } from './tracking/tracking-funnel.entity.js';
import { TrackingPageviewEntity } from './tracking/tracking-pageview.entity.js';
import { TrackingRecordingChunkEntity } from './tracking/tracking-recording-chunk.entity.js';
import { TrackingSessionEntity } from './tracking/tracking-session.entity.js';
import { TrackingSettingsEntity } from './tracking/tracking-settings.entity.js';
import { TrackingModule } from './tracking/tracking.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env['DATABASE_URL'],
      entities: [
        ExperienceEntity,
        ProjectEntity,
        ContactSubmissionEntity,
        SiteProfileEntity,
        SeoMetaEntity,
        SkillEntity,
        TrackingSettingsEntity,
        TrackingSessionEntity,
        TrackingPageviewEntity,
        TrackingEventEntity,
        TrackingFunnelEntity,
        TrackingClickEntity,
        TrackingClickAggregateEntity,
        TrackingRecordingChunkEntity,
      ],
      synchronize: false,
    }),
    RedisModule,
    HealthModule,
    CacheAdminModule,
    ExperiencesModule,
    ContactSubmissionsModule,
    SiteProfileModule,
    SeoMetaModule,
    SkillsModule,
    TrackingModule,
  ],
})
export class AppModule {}
