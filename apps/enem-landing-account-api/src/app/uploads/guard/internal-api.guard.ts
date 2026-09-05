import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Authenticates a server-to-server caller (e.g. `enem-landing-api`
 * forwarding a session-recording chunk) via a shared secret header,
 * instead of the `JwtAuthGuard` used for a real logged-in user - there is
 * no user session to check for a call that never touched a browser.
 */
@Injectable()
export class InternalApiGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-internal-api-key'];
    const expectedKey = process.env['INTERNAL_API_KEY'];

    if (!expectedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
