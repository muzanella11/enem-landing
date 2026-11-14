import { RateLimit } from '@enem-landing/backend-rate-limit';
import { SsoAuthGuard } from '@enem-landing/backend-sso';
import { successResponse } from '@enem-landing/backend-utils';
import type { User } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { ContactSubmissionsService } from './contact-submissions.service.js';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto.js';
import {
  ListContactSubmissionsQueryDto,
  UpdateContactSubmissionSpamDto,
} from './dto/admin-contact-submission.dto.js';
import type { ContactRequestContext } from './sender/contact-sender-enrichment.service.js';

const header = (req: Request, name: string): string | undefined => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Visitor details from the request. The web BFF forwards the visitor's own
 * headers (and Cloudflare's), and this app is internal-only, so they come
 * from that trusted hop rather than straight from the browser.
 */
const requestContext = (req: Request): ContactRequestContext => ({
  ip: req.ip ?? null,
  userAgent: header(req, 'user-agent'),
  acceptLanguage: header(req, 'accept-language'),
  referer: header(req, 'referer'),
  cfCountry: header(req, 'cf-ipcountry'),
  cfRegion: header(req, 'cf-region'),
  cfCity: header(req, 'cf-ipcity'),
  cfRay: header(req, 'cf-ray'),
});

@Controller('contact-submissions')
export class ContactSubmissionsController {
  constructor(
    private readonly contactSubmissionsService: ContactSubmissionsService,
  ) {}

  @RateLimit('contact')
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateContactSubmissionDto) {
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.contactSubmissionsService.create(dto, requestContext(req)),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: ListContactSubmissionsQueryDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.contactSubmissionsService.findAll(query),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.contactSubmissionsService.findDetail(id),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Patch(':id/read')
  async markAsRead(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.contactSubmissionsService.markAsRead(id),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Patch(':id/spam')
  async setSpam(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateContactSubmissionSpamDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.contactSubmissionsService.setSpam(id, dto.isSpam),
    );
  }
}
