import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { DeployService } from './deploy.service.js';

/** Read-only: no deploy or rollback can be triggered from the monitor. */
@RateLimit('admin')
@Controller('deploy')
export class DeployController {
  constructor(private readonly deploy: DeployService) {}

  @Get()
  async overview() {
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.deploy.overview(),
    );
  }
}
