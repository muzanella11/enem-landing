import { CacheModule } from '@enem-landing/backend-cache';
import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEntity } from './skill.entity.js';
import { SkillsController } from './skills.controller.js';
import { SkillsService } from './skills.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity]), SsoModule, CacheModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
