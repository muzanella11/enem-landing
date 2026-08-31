import { RedisService } from '@enem-landing/backend-redis';
import { successResponse } from '@enem-landing/backend-utils';
import { Role } from '@enem-landing/shared-definitions';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { allowSignup, jwtExpiresInSeconds } from './auth.constants.js';
import type { AuthJwtPayload } from './auth-jwt-payload.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
import { UserEntity } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  getAuthSessionKey(userId: string): string {
    return `auth:${userId}:token`;
  }

  private toPayload(user: UserEntity): AuthJwtPayload {
    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };
  }

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  /**
   * Enabled for structural parity with mau-account-api, but gated behind
   * `ALLOW_SIGNUP` (default off) — see Story 03. The admin account is
   * provisioned by the seed script, not through this endpoint.
   */
  async signup(dto: SignupDto) {
    if (!allowSignup) {
      throw new ForbiddenException('Signup is disabled');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ForbiddenException('User already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      fullname: dto.fullname,
      email: dto.email,
      passwordHash,
      role: Role.Admin,
    });

    return successResponse(201, 'Success', { id: user.id, email: user.email });
  }

  async signin(user: UserEntity) {
    const payload = this.toPayload(user);
    const token = this.jwtService.sign(payload, {
      expiresIn: jwtExpiresInSeconds,
    });

    await this.redisService.setValue(
      this.getAuthSessionKey(user.id),
      token,
      jwtExpiresInSeconds,
    );

    return successResponse(200, 'Success', { token });
  }

  async whoami(payload: AuthJwtPayload) {
    return successResponse(200, 'Success', payload);
  }

  async signout(userId: string) {
    await this.redisService.deleteValue(this.getAuthSessionKey(userId));
    return successResponse(200, 'Success logged out');
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new ForbiddenException('New password does not match confirmation');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersService.updatePassword(userId, passwordHash);

    // Invalidate the current session so a stolen-but-changed password can't
    // keep an old token alive.
    await this.redisService.deleteValue(this.getAuthSessionKey(userId));

    return successResponse(200, 'Password changed successfully');
  }
}
