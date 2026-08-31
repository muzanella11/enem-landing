import '../load-env.js';
import type { DataSourceOptions } from 'typeorm';
import { ContactSubmissionEntity } from '../app/contact-submissions/contact-submission.entity.js';
import { ExperienceEntity } from '../app/experiences/experience.entity.js';
import { ProjectEntity } from '../app/experiences/project.entity.js';
import { SeoMetaEntity } from '../app/seo-meta/seo-meta.entity.js';
import { SiteProfileEntity } from '../app/site-profile/site-profile.entity.js';
import { SkillEntity } from '../app/skills/skill.entity.js';

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
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
};
