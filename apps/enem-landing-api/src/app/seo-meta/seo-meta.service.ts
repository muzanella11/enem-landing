import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertSeoMetaDto } from './dto/upsert-seo-meta.dto.js';
import { SeoMetaEntity } from './seo-meta.entity.js';

@Injectable()
export class SeoMetaService {
  constructor(
    @InjectRepository(SeoMetaEntity)
    private readonly repository: Repository<SeoMetaEntity>,
  ) {}

  findAll(): Promise<SeoMetaEntity[]> {
    return this.repository.find({ order: { pageKey: 'ASC' } });
  }

  async findByPageKey(pageKey: string): Promise<SeoMetaEntity> {
    const entry = await this.repository.findOne({ where: { pageKey } });
    if (!entry) {
      throw new NotFoundException('SEO meta not found for this page');
    }
    return entry;
  }

  async upsert(dto: UpsertSeoMetaDto): Promise<SeoMetaEntity> {
    const existing = await this.repository.findOne({
      where: { pageKey: dto.pageKey },
    });
    if (existing) {
      return this.repository.save({ ...existing, ...dto });
    }
    return this.repository.save(this.repository.create(dto));
  }

  async remove(pageKey: string): Promise<void> {
    const entry = await this.findByPageKey(pageKey);
    await this.repository.remove(entry);
  }
}
