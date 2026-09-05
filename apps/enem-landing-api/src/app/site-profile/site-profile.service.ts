import { CacheService } from '@enem-landing/backend-cache';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_KEYS, CACHE_TTL_SECONDS } from '../cache/cache.constants.js';
import { UpdateSiteProfileDto } from './dto/update-site-profile.dto.js';
import { SiteProfileEntity } from './site-profile.entity.js';

@Injectable()
export class SiteProfileService {
  constructor(
    @InjectRepository(SiteProfileEntity)
    private readonly repository: Repository<SiteProfileEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async getOrCreate(): Promise<SiteProfileEntity> {
    const cached = await this.cacheService.getCached<SiteProfileEntity>(
      CACHE_KEYS.PUBLIC_SITE_PROFILE,
    );
    if (cached) return cached;

    const profile = await this.findOrCreateRow();
    await this.cacheService.setCached(
      CACHE_KEYS.PUBLIC_SITE_PROFILE,
      profile,
      CACHE_TTL_SECONDS[CACHE_KEYS.PUBLIC_SITE_PROFILE],
    );
    return profile;
  }

  async update(dto: UpdateSiteProfileDto): Promise<SiteProfileEntity> {
    const profile = await this.findOrCreateRow();
    Object.assign(profile, dto);
    const saved = await this.repository.save(profile);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_SITE_PROFILE);
    return saved;
  }

  /** Single-row config — creates the row with empty defaults on first read/write. */
  private async findOrCreateRow(): Promise<SiteProfileEntity> {
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
}
