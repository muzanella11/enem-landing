import { CacheModule } from '@enem-landing/backend-cache';
import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteProfileController } from './site-profile.controller.js';
import { SiteProfileEntity } from './site-profile.entity.js';
import { SiteProfileService } from './site-profile.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteProfileEntity]),
    SsoModule,
    CacheModule,
  ],
  controllers: [SiteProfileController],
  providers: [SiteProfileService],
})
export class SiteProfileModule {}
