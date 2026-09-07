import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogCategoryEntity } from './blog-category.entity.js';
import { BlogCategoriesController } from './blog-categories.controller.js';
import { BlogCategoriesService } from './blog-categories.service.js';
import { BlogPostEntity } from './blog-post.entity.js';
import { BlogPostsController } from './blog-posts.controller.js';
import { BlogPostsService } from './blog-posts.service.js';
import { BlogTagEntity } from './blog-tag.entity.js';
import { BlogTagsController } from './blog-tags.controller.js';
import { BlogTagsService } from './blog-tags.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogPostEntity,
      BlogCategoryEntity,
      BlogTagEntity,
    ]),
    SsoModule,
  ],
  controllers: [
    BlogPostsController,
    BlogCategoriesController,
    BlogTagsController,
  ],
  providers: [BlogPostsService, BlogCategoriesService, BlogTagsService],
})
export class BlogModule {}
