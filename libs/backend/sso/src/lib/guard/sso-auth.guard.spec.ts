import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SsoAuthGuard } from './sso-auth.guard.js';
import type { SsoService } from '../sso.service.js';

const buildContext = (request: Record<string, unknown>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('SsoAuthGuard', () => {
  it('allows the request and attaches req.user on a valid token', async () => {
    const ssoService = {
      extractToken: vi.fn(() => 'valid-token'),
      whoAmI: vi.fn(async () => ({ statusCode: 200, message: 'Success', data: { id: 'user-1' } })),
    } as unknown as SsoService;
    const guard = new SsoAuthGuard(ssoService);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer valid-token' } };

    await expect(guard.canActivate(buildContext(request))).resolves.toBe(true);
    expect(request['user']).toEqual({ id: 'user-1' });
    expect(request['token']).toBe('valid-token');
  });

  it('rejects when whoAmI fails (expired/invalid token)', async () => {
    const ssoService = {
      extractToken: vi.fn(() => 'stale-token'),
      whoAmI: vi.fn(async () => {
        throw new UnauthorizedException();
      }),
    } as unknown as SsoService;
    const guard = new SsoAuthGuard(ssoService);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer stale-token' } };

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when no Authorization header is present (extractToken throws)', async () => {
    const ssoService = {
      extractToken: vi.fn(() => {
        throw new UnauthorizedException('Token is required');
      }),
      whoAmI: vi.fn(),
    } as unknown as SsoService;
    const guard = new SsoAuthGuard(ssoService);

    await expect(guard.canActivate(buildContext({ headers: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(ssoService.whoAmI).not.toHaveBeenCalled();
  });
});
