import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperienceEntity } from './experience.entity.js';
import { ExperiencesController } from './experiences.controller.js';
import { ExperiencesService } from './experiences.service.js';
import { ProjectEntity } from './project.entity.js';
import { ProjectsController } from './projects.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExperienceEntity, ProjectEntity]), SsoModule],
  controllers: [ExperiencesController, ProjectsController],
  providers: [ExperiencesService],
})
export class ExperiencesModule {}
