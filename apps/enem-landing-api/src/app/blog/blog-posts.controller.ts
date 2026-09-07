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
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { BlogPostsService } from './blog-posts.service.js';
import { BlogPostsQueryDto } from './dto/blog-posts-query.dto.js';
import { CreateBlogPostDto } from './dto/create-blog-post.dto.js';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto.js';

@Controller('blog-posts')
export class BlogPostsController {
  constructor(private readonly blogPostsService: BlogPostsService) {}

  @Get()
  findPublished(@Query() query: BlogPostsQueryDto) {
    return this.blogPostsService.findPublished(query);
  }

  // Declared before the `:slug`/`:slug/related` routes below - Nest
  // matches GET routes in declaration order, so a literal path like
  // `admin` must come first or it'd be captured by the `:slug` handler.
  @UseGuards(SsoAuthGuard)
  @Get('admin')
  findAllForAdmin(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogPostsService.findAllForAdmin();
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/:id')
  findOneForAdmin(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogPostsService.findOneForAdmin(id);
  }

  @UseGuards(SsoAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreateBlogPostDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogPostsService.create(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogPostsService.update(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.blogPostsService.remove(id);
  }

  @Get(':slug/related')
  findRelated(@Param('slug') slug: string) {
    return this.blogPostsService.findRelatedBySlug(slug);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogPostsService.findBySlug(slug);
  }
}
