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
import { BlogCategoriesService } from './blog-categories.service.js';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto.js';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto.js';

@Controller('blog-categories')
export class BlogCategoriesController {
  constructor(private readonly blogCategoriesService: BlogCategoriesService) {}

  // `?published=true` (public blog filter): only entries used by a
  // published post, with `postCount`. Without it (CMS): every entry.
  @Get()
  async findAll(@Query('published') published?: string) {
    return successResponse(
      HttpStatus.OK,
      'Success',
      await (published === 'true'
        ? this.blogCategoriesService.findPublished()
        : this.blogCategoriesService.findAll()),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateBlogCategoryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.blogCategoriesService.create(dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBlogCategoryDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.blogCategoriesService.update(id, dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.blogCategoriesService.remove(id),
    );
  }
}
