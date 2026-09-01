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
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { SkillsService } from './skills.service.js';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  findAll() {
    return this.skillsService.findAll();
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreateSkillDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.skillsService.create(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateSkillDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.skillsService.update(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.skillsService.remove(id);
  }
}
