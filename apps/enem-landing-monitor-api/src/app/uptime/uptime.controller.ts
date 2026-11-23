import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import { Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { UptimeService } from './uptime.service.js';

const ok = (data: unknown) => successResponse(HttpStatus.OK, 'Success', data);

/** Read-only: targets are fixed in code, nothing here takes a URL. */
@RateLimit('admin')
@Controller('uptime')
export class UptimeController {
  constructor(private readonly uptime: UptimeService) {}

  @Get()
  async overview() {
    return ok(await this.uptime.overview());
  }

  @Post('tls/refresh')
  async refreshTls() {
    return ok(await this.uptime.tls(true));
  }
}
