import { RedisService } from '@enem-landing/backend-redis';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtSecret } from '../auth.constants.js';
import { AuthService } from '../auth.service.js';
import type { AuthJwtPayload } from '../auth-jwt-payload.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: AuthJwtPayload): Promise<AuthJwtPayload> {
    const session = await this.redisService.getValue(
      this.authService.getAuthSessionKey(payload.id),
    );

    if (!session) {
      throw new UnauthorizedException('Session has expired or is invalid');
    }

    return payload;
  }
}
