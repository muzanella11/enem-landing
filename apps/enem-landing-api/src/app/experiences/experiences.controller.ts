import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { CreateExperienceDto } from './dto/create-experience.dto.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateExperienceDto } from './dto/update-experience.dto.js';
import { ExperiencesService } from './experiences.service.js';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  findAll() {
    return this.experiencesService.findAll();
  }

  @UseGuards(SsoAuthGuard)
  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.experiencesService.findOne(id);
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreateExperienceDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.experiencesService.create(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.experiencesService.update(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.experiencesService.remove(id);
  }

  @UseGuards(SsoAuthGuard)
  @Post(':id/projects')
  createProject(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateProjectDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.experiencesService.createProject(id, dto);
  }
}
