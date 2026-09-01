import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { SsoService } from '../sso.service.js';

@Injectable()
export class SsoAuthGuard implements CanActivate {
  constructor(private readonly ssoService: SsoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.ssoService.extractToken(request);

    try {
      const response = await this.ssoService.whoAmI(token);
      (request as Request & { token: string }).token = token;
      (request as Request & { user: unknown }).user = response.data;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
