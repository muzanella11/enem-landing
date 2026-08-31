import { Role } from '@enem-landing/shared-definitions';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const payload = { id: 'user-1', fullname: 'Admin', email: 'admin@example.com', role: Role.Admin };

  it('accepts the payload when a Redis session key exists', async () => {
    const redisService = { getValue: vi.fn().mockResolvedValue('signed.jwt.token') };
    const authService = { getAuthSessionKey: (id: string) => `auth:${id}:token` } as AuthService;
    const strategy = new JwtStrategy(authService, redisService as never);

    await expect(strategy.validate(payload)).resolves.toBe(payload);
    expect(redisService.getValue).toHaveBeenCalledWith('auth:user-1:token');
  });

  it('rejects when the Redis session has expired or was signed out', async () => {
    const redisService = { getValue: vi.fn().mockResolvedValue(null) };
    const authService = { getAuthSessionKey: (id: string) => `auth:${id}:token` } as AuthService;
    const strategy = new JwtStrategy(authService, redisService as never);

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});
