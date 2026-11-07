import { slugify } from '@enem-landing/shared-utils';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  findPublishedTaxonomy,
  type PublishedTaxonomyRow,
} from './published-taxonomy.js';
import { BlogCategoryEntity } from './blog-category.entity.js';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto.js';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto.js';

@Injectable()
export class BlogCategoriesService {
  constructor(
    @InjectRepository(BlogCategoryEntity)
    private readonly repository: Repository<BlogCategoryEntity>,
  ) {}

  findAll(): Promise<BlogCategoryEntity[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  /** Only the ones used by a published post, with that post count (public blog filter). */
  findPublished(): Promise<PublishedTaxonomyRow[]> {
    return findPublishedTaxonomy(this.repository, 'blog_post_categories', 'categoryId');
  }

  create(dto: CreateBlogCategoryDto): Promise<BlogCategoryEntity> {
    return this.repository.save(
      this.repository.create({
        name: dto.name,
        slug: slugify(dto.slug || dto.name),
      }),
    );
  }

  async update(
    id: string,
    dto: UpdateBlogCategoryDto,
  ): Promise<BlogCategoryEntity> {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = slugify(dto.slug);
    return this.repository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.repository.remove(category);
  }
}
