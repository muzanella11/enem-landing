import { successResponse } from '@enem-landing/backend-utils';
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
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { SkillsService } from './skills.service.js';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  async findAll() {
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.skillsService.findAll(),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateSkillDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.skillsService.create(dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.skillsService.update(id, dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.skillsService.remove(id),
    );
  }
}
