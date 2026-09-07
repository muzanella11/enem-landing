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
import { BlogTagsService } from './blog-tags.service.js';
import { CreateBlogTagDto } from './dto/create-blog-tag.dto.js';
import { UpdateBlogTagDto } from './dto/update-blog-tag.dto.js';

@Controller('blog-tags')
export class BlogTagsController {
  constructor(private readonly blogTagsService: BlogTagsService) {}

  @Get()
  findAll() {
    return this.blogTagsService.findAll();
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreateBlogTagDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogTagsService.create(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBlogTagDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogTagsService.update(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogTagsService.remove(id);
  }
}
