import { CacheModule } from '@enem-landing/backend-cache';
import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { CacheController } from './cache.controller.js';

@Module({
  imports: [CacheModule, SsoModule],
  controllers: [CacheController],
})
export class CacheAdminModule {}
