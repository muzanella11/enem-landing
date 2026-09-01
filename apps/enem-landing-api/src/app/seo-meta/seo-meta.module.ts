import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoMetaController } from './seo-meta.controller.js';
import { SeoMetaEntity } from './seo-meta.entity.js';
import { SeoMetaService } from './seo-meta.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SeoMetaEntity]), SsoModule],
  controllers: [SeoMetaController],
  providers: [SeoMetaService],
})
export class SeoMetaModule {}
