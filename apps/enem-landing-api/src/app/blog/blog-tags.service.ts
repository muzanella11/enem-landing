import { slugify } from '@enem-landing/shared-utils';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogTagEntity } from './blog-tag.entity.js';
import { CreateBlogTagDto } from './dto/create-blog-tag.dto.js';
import { UpdateBlogTagDto } from './dto/update-blog-tag.dto.js';

@Injectable()
export class BlogTagsService {
  constructor(
    @InjectRepository(BlogTagEntity)
    private readonly repository: Repository<BlogTagEntity>,
  ) {}

  findAll(): Promise<BlogTagEntity[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  create(dto: CreateBlogTagDto): Promise<BlogTagEntity> {
    return this.repository.save(
      this.repository.create({
        name: dto.name,
        slug: slugify(dto.slug || dto.name),
      }),
    );
  }

  async update(id: string, dto: UpdateBlogTagDto): Promise<BlogTagEntity> {
    const tag = await this.repository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    if (dto.name !== undefined) tag.name = dto.name;
    if (dto.slug !== undefined) tag.slug = slugify(dto.slug);
    return this.repository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const tag = await this.repository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    await this.repository.remove(tag);
  }
}
