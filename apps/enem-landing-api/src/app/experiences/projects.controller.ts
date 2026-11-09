import { successResponse } from '@enem-landing/backend-utils';
import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ExperiencesService } from './experiences.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.experiencesService.updateProject(id, dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.experiencesService.removeProject(id),
    );
  }
}
