import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import type { CaptchaChallenge } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CaptchaService } from './captcha.service.js';
import { VerifyCaptchaDto } from './dto/verify-captcha.dto.js';

@RateLimit('captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('challenge')
  @Header('Cache-Control', 'no-store')
  async challenge() {
    const challenge = await this.captchaService.createChallenge();
    return successResponse<CaptchaChallenge>(
      HttpStatus.OK,
      'Success',
      challenge,
    );
  }

  @Post('verify')
  async verify(@Body() dto: VerifyCaptchaDto) {
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.captchaService.verify(dto),
    );
  }
}
