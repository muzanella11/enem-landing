import { CacheService } from '@enem-landing/backend-cache';
import {
  isRecordingAllowedForSite,
  type TrackingSite,
} from '@enem-landing/shared-definitions';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CACHE_TTL_SECONDS,
  TRACKING_CONFIG_CACHE_KEY_BY_SITE,
} from '../cache/cache.constants.js';
import { UpdateTrackingSettingsDto } from './dto/update-tracking-settings.dto.js';
import { TrackingSettingsEntity } from './tracking-settings.entity.js';

@Injectable()
export class TrackingSettingsService {
  constructor(
    @InjectRepository(TrackingSettingsEntity)
    private readonly repository: Repository<TrackingSettingsEntity>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Settings for one site. For sites where recording is never allowed
   * (see `RECORDING_DISABLED_SITES`) the returned row always reports
   * recording as off, whatever the DB says - so a manually edited row
   * still can't switch it on.
   */
  async getOrCreate(
    site: TrackingSite = 'landing',
  ): Promise<TrackingSettingsEntity> {
    const cacheKey = TRACKING_CONFIG_CACHE_KEY_BY_SITE[site];
    const cached =
      await this.cacheService.getCached<TrackingSettingsEntity>(cacheKey);
    if (cached) return this.enforceSitePolicy(cached);

    const settings = this.enforceSitePolicy(await this.findOrCreateRow(site));
    await this.cacheService.setCached(
      cacheKey,
      settings,
      CACHE_TTL_SECONDS[cacheKey],
    );
    return settings;
  }

  async update(
    dto: UpdateTrackingSettingsDto,
    site: TrackingSite = 'landing',
  ): Promise<TrackingSettingsEntity> {
    if (dto.sessionRecordingEnabled && !isRecordingAllowedForSite(site)) {
      throw new BadRequestException(
        `Session recording cannot be enabled for site "${site}"`,
      );
    }
    const settings = await this.findOrCreateRow(site);
    Object.assign(settings, dto);
    const saved = await this.repository.save(settings);
    await this.cacheService.invalidate(TRACKING_CONFIG_CACHE_KEY_BY_SITE[site]);
    return saved;
  }

  private enforceSitePolicy(
    settings: TrackingSettingsEntity,
  ): TrackingSettingsEntity {
    if (isRecordingAllowedForSite(settings.site ?? 'landing')) return settings;
    return { ...settings, sessionRecordingEnabled: false };
  }

  /** One row per site - creates the row with every feature disabled on first read/write. */
  private async findOrCreateRow(
    site: TrackingSite,
  ): Promise<TrackingSettingsEntity> {
    const existing = await this.repository.findOne({ where: { site } });
    if (existing) return existing;
    return this.repository.save(
      this.repository.create({
        site,
        pageviewEnabled: false,
        eventsEnabled: false,
        heatmapEnabled: false,
        sessionRecordingEnabled: false,
        sessionRecordingSampleRatePct: 10,
      }),
    );
  }
}
