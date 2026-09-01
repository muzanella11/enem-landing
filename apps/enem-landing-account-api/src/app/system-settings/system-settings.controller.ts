import { Role } from '@enem-landing/shared-definitions';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard.js';
import type { AuthJwtPayload } from '../auth/auth-jwt-payload.js';
import { SystemSettingsService } from './system-settings.service.js';

const assertAdmin = (user: AuthJwtPayload): void => {
  if (user.role !== Role.Admin && user.role !== Role.SuperAdmin) {
    throw new ForbiddenException('Admin access required');
  }
};

@Controller('system-settings')
@UseGuards(JwtAuthGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async getAll(@Request() req: ExpressRequest) {
    assertAdmin(req.user as AuthJwtPayload);
    const data = await this.systemSettingsService.getAll();
    return { statusCode: 200, message: 'Success', data };
  }

  @Put()
  async upsertMany(
    @Request() req: ExpressRequest,
    @Body() body: Record<string, string>,
  ) {
    assertAdmin(req.user as AuthJwtPayload);
    await this.systemSettingsService.upsertMany(body);
    const data = await this.systemSettingsService.getAll();
    return { statusCode: 200, message: 'Settings updated successfully', data };
  }
}
