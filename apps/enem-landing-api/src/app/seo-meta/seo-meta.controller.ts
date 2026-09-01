import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { UpsertSeoMetaDto } from './dto/upsert-seo-meta.dto.js';
import { SeoMetaService } from './seo-meta.service.js';

@Controller('seo-meta')
export class SeoMetaController {
  constructor(private readonly seoMetaService: SeoMetaService) {}

  @UseGuards(SsoAuthGuard)
  @Get()
  findAll(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.seoMetaService.findAll();
  }

  @Get(':pageKey')
  findByPageKey(@Param('pageKey') pageKey: string) {
    return this.seoMetaService.findByPageKey(pageKey);
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  upsert(@Req() req: Request, @Body() dto: UpsertSeoMetaDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.seoMetaService.upsert(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':pageKey')
  remove(@Req() req: Request, @Param('pageKey') pageKey: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.seoMetaService.remove(pageKey);
  }
}
