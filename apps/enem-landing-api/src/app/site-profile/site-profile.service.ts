import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSiteProfileDto } from './dto/update-site-profile.dto.js';
import { SiteProfileEntity } from './site-profile.entity.js';

@Injectable()
export class SiteProfileService {
  constructor(
    @InjectRepository(SiteProfileEntity)
    private readonly repository: Repository<SiteProfileEntity>,
  ) {}

  /** Single-row config — creates the row with empty defaults on first read/write. */
  async getOrCreate(): Promise<SiteProfileEntity> {
    const existing = await this.repository.find({ take: 1 });
    if (existing.length > 0) {
      return existing[0];
    }
    return this.repository.save(
      this.repository.create({
        heroTitle: '',
        heroSubtitle: '',
        bio: '',
        avatarUrl: '',
        socialLinks: [],
      }),
    );
  }

  async update(dto: UpdateSiteProfileDto): Promise<SiteProfileEntity> {
    const profile = await this.getOrCreate();
    Object.assign(profile, dto);
    return this.repository.save(profile);
  }
}
