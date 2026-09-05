import '../load-env.js';
import type { DataSourceOptions } from 'typeorm';
import { ContactSubmissionEntity } from '../app/contact-submissions/contact-submission.entity.js';
import { ExperienceEntity } from '../app/experiences/experience.entity.js';
import { ProjectEntity } from '../app/experiences/project.entity.js';
import { SeoMetaEntity } from '../app/seo-meta/seo-meta.entity.js';
import { SiteProfileEntity } from '../app/site-profile/site-profile.entity.js';
import { SkillEntity } from '../app/skills/skill.entity.js';
import { TrackingClickAggregateEntity } from '../app/tracking/tracking-click-aggregate.entity.js';
import { TrackingClickEntity } from '../app/tracking/tracking-click.entity.js';
import { TrackingEventEntity } from '../app/tracking/tracking-event.entity.js';
import { TrackingFunnelEntity } from '../app/tracking/tracking-funnel.entity.js';
import { TrackingPageviewEntity } from '../app/tracking/tracking-pageview.entity.js';
import { TrackingRecordingChunkEntity } from '../app/tracking/tracking-recording-chunk.entity.js';
import { TrackingSessionEntity } from '../app/tracking/tracking-session.entity.js';
import { TrackingSettingsEntity } from '../app/tracking/tracking-settings.entity.js';

/** Used by the TypeORM CLI (migrations) and the seed entrypoint below. */
export const config: DataSourceOptions = {
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
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
};
