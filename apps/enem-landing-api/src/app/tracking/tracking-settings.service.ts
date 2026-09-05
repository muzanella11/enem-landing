import { CacheService } from '@enem-landing/backend-cache';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_KEYS, CACHE_TTL_SECONDS } from '../cache/cache.constants.js';
import { UpdateTrackingSettingsDto } from './dto/update-tracking-settings.dto.js';
import { TrackingSettingsEntity } from './tracking-settings.entity.js';

@Injectable()
export class TrackingSettingsService {
  constructor(
    @InjectRepository(TrackingSettingsEntity)
    private readonly repository: Repository<TrackingSettingsEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async getOrCreate(): Promise<TrackingSettingsEntity> {
    const cached = await this.cacheService.getCached<TrackingSettingsEntity>(
      CACHE_KEYS.PUBLIC_TRACKING_CONFIG,
    );
    if (cached) return cached;

    const settings = await this.findOrCreateRow();
    await this.cacheService.setCached(
      CACHE_KEYS.PUBLIC_TRACKING_CONFIG,
      settings,
      CACHE_TTL_SECONDS[CACHE_KEYS.PUBLIC_TRACKING_CONFIG],
    );
    return settings;
  }

  async update(
    dto: UpdateTrackingSettingsDto,
  ): Promise<TrackingSettingsEntity> {
    const settings = await this.findOrCreateRow();
    Object.assign(settings, dto);
    const saved = await this.repository.save(settings);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_TRACKING_CONFIG);
    return saved;
  }

  /** Single-row config — creates the row with every feature disabled on first read/write. */
  private async findOrCreateRow(): Promise<TrackingSettingsEntity> {
    const existing = await this.repository.find({ take: 1 });
    if (existing.length > 0) {
      return existing[0];
    }
    return this.repository.save(
      this.repository.create({
        pageviewEnabled: false,
        eventsEnabled: false,
        heatmapEnabled: false,
        sessionRecordingEnabled: false,
        sessionRecordingSampleRatePct: 10,
      }),
    );
  }
}
