import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { ContactSubmissionsService } from './contact-submissions.service.js';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto.js';

@Controller('contact-submissions')
export class ContactSubmissionsController {
  constructor(
    private readonly contactSubmissionsService: ContactSubmissionsService,
  ) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateContactSubmissionDto) {
    return this.contactSubmissionsService.create(dto, req.ip ?? 'unknown');
  }

  @UseGuards(SsoAuthGuard)
  @Get()
  findAll(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.contactSubmissionsService.findAll();
  }

  @UseGuards(SsoAuthGuard)
  @Patch(':id/read')
  markAsRead(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.contactSubmissionsService.markAsRead(id);
  }
}
