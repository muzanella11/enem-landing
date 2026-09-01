import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service.js';
import { UserEntity } from '../../users/user.entity.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  validate(email: string, password: string): Promise<UserEntity> {
    return this.authService.validateUser(email, password);
  }
}
