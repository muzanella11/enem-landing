import { Module } from '@nestjs/common';
import { CaptchaController } from './captcha.controller.js';
import { CaptchaService } from './captcha.service.js';

@Module({
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
