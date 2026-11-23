import { RateLimit } from '@enem-landing/backend-rate-limit';
import { RedisService } from '@enem-landing/backend-redis';
import { successResponse } from '@enem-landing/backend-utils';
import type { MonitorOverview, User } from '@enem-landing/shared-types';
import { Controller, Get, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  logsEnabled,
  monitorApiVersion,
  monitorEnvironment,
} from '../monitor.config.js';

@RateLimit('admin')
@Controller('overview')
export class OverviewController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  async overview(@Req() req: Request & { user: User }) {
    let redisConnected = false;
    try {
      redisConnected = (await this.redisService.ping()) === 'PONG';
    } catch {
      redisConnected = false;
    }
    const data: MonitorOverview = {
      user: {
        fullname: req.user.fullname,
        email: req.user.email,
        role: req.user.role,
      },
      environment: monitorEnvironment(),
      version: monitorApiVersion(),
      logsEnabled: logsEnabled(),
      serverTime: new Date().toISOString(),
      redisConnected,
    };
    return successResponse(HttpStatus.OK, 'Success', data);
  }
}
