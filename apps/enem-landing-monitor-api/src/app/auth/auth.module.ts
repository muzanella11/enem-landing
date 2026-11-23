import { SsoAuthGuard, SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SuperAdminGuard } from './super-admin.guard.js';

@Module({
  imports: [SsoModule],
  providers: [SsoAuthGuard, { provide: APP_GUARD, useClass: SuperAdminGuard }],
})
export class AuthModule {}
