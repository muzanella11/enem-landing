import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactSubmissionEntity } from './contact-submissions/contact-submission.entity.js';
import { ContactSubmissionsModule } from './contact-submissions/contact-submissions.module.js';
import { ExperienceEntity } from './experiences/experience.entity.js';
import { ExperiencesModule } from './experiences/experiences.module.js';
import { ProjectEntity } from './experiences/project.entity.js';
import { HealthModule } from './health/health.module.js';
import { KeepAliveModule } from './keep-alive/keep-alive.module.js';
import { SeoMetaEntity } from './seo-meta/seo-meta.entity.js';
import { SeoMetaModule } from './seo-meta/seo-meta.module.js';
import { SiteProfileEntity } from './site-profile/site-profile.entity.js';
import { SiteProfileModule } from './site-profile/site-profile.module.js';
import { SkillEntity } from './skills/skill.entity.js';
import { SkillsModule } from './skills/skills.module.js';

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
      ],
      synchronize: false,
    }),
    HealthModule,
    KeepAliveModule,
    ExperiencesModule,
    ContactSubmissionsModule,
    SiteProfileModule,
    SeoMetaModule,
    SkillsModule,
  ],
})
export class AppModule {}
