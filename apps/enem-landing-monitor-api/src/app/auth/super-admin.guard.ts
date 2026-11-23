import { assertSuperAdminRole, SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_METADATA } from './public.decorator.js';

/**
 * Registered as APP_GUARD, so every route (including ones added later) is
 * SuperAdmin-only by default: 401 without a valid SSO token, 403 for any
 * other role.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ssoAuthGuard: SsoAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return false;
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    await this.ssoAuthGuard.canActivate(context);
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    assertSuperAdminRole(request.user);
    return true;
  }
}
