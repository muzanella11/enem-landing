import { SkipRateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import { Controller, Get, HttpStatus } from '@nestjs/common';

@SkipRateLimit()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return successResponse(HttpStatus.OK, 'Success', {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    });
  }
}
