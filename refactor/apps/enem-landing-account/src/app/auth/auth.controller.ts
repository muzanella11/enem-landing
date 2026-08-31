import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { JwtAuthGuard } from './guard/jwt-auth.guard.js';
import { LocalAuthGuard } from './guard/local-auth.guard.js';
import type { AuthJwtPayload } from './auth-jwt-payload.js';
import { UserEntity } from '../users/user.entity.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  signin(@Request() req: ExpressRequest) {
    return this.authService.signin(req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard)
  @Post('whoami')
  whoami(@Request() req: ExpressRequest) {
    return this.authService.whoami(req.user as AuthJwtPayload);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  signout(@Request() req: ExpressRequest) {
    return this.authService.signout((req.user as AuthJwtPayload).id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Request() req: ExpressRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      (req.user as AuthJwtPayload).id,
      dto,
    );
  }
}
