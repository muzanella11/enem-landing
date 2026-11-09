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
  Query,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { BlogTagsService } from './blog-tags.service.js';
import { CreateBlogTagDto } from './dto/create-blog-tag.dto.js';
import { UpdateBlogTagDto } from './dto/update-blog-tag.dto.js';

@Controller('blog-tags')
export class BlogTagsController {
  constructor(private readonly blogTagsService: BlogTagsService) {}

  // `?published=true` (public blog filter): only entries used by a
  // published post, with `postCount`. Without it (CMS): every entry.
  @Get()
  async findAll(@Query('published') published?: string) {
    return successResponse(
      HttpStatus.OK,
      'Success',
      await (published === 'true'
        ? this.blogTagsService.findPublished()
        : this.blogTagsService.findAll()),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateBlogTagDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.blogTagsService.create(dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBlogTagDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.blogTagsService.update(id, dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.blogTagsService.remove(id),
    );
  }
}
