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
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.experiencesService.updateProject(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.experiencesService.removeProject(id);
  }
}
