import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { UpdateSiteProfileDto } from './dto/update-site-profile.dto.js';
import { SiteProfileService } from './site-profile.service.js';

@Controller('site-profile')
export class SiteProfileController {
  constructor(private readonly siteProfileService: SiteProfileService) {}

  @Get()
  get() {
    return this.siteProfileService.getOrCreate();
  }

  @UseGuards(SsoAuthGuard)
  @Put()
  update(@Req() req: Request, @Body() dto: UpdateSiteProfileDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.siteProfileService.update(dto);
  }
}
