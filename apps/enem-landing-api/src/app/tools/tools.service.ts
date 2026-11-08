import { CacheService } from '@enem-landing/backend-cache';
import type {
  DonationClickStats,
  ToolsPublicConfig,
  ToolUsageStats,
} from '@enem-landing/shared-types';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_KEYS, CACHE_TTL_SECONDS } from '../cache/cache.constants.js';
import { TrackingService } from '../tracking/tracking.service.js';
import { DonationOptionEntity } from './donation-option.entity.js';
import { CreateDonationOptionDto } from './dto/create-donation-option.dto.js';
import { CreateToolDto } from './dto/create-tool.dto.js';
import { UpdateDonationOptionDto } from './dto/update-donation-option.dto.js';
import { UpdateToolDto } from './dto/update-tool.dto.js';
import { UpdateToolsSettingsDto } from './dto/update-tools-settings.dto.js';
import { ToolEntity } from './tool.entity.js';
import { ToolsSettingsEntity } from './tools-settings.entity.js';

const STATS_WINDOW_DAYS = 30;

/**
 * Registry behind tools.muzanella.com (Story 25): which tools are listed
 * and in what order, the ad switches, and the donation options. Every
 * write invalidates the public config cache so the tools app picks it up
 * on its next SWR refresh.
 */
@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(ToolEntity)
    private readonly toolRepository: Repository<ToolEntity>,
    @InjectRepository(DonationOptionEntity)
    private readonly donationRepository: Repository<DonationOptionEntity>,
    @InjectRepository(ToolsSettingsEntity)
    private readonly settingsRepository: Repository<ToolsSettingsEntity>,
    private readonly cacheService: CacheService,
    private readonly trackingService: TrackingService,
  ) {}

  async getPublicConfig(): Promise<ToolsPublicConfig> {
    const cached = await this.cacheService.getCached<ToolsPublicConfig>(
      CACHE_KEYS.PUBLIC_TOOLS_CONFIG,
    );
    if (cached) return cached;

    const [tools, donationOptions, settings] = await Promise.all([
      this.toolRepository.find({
        where: { enabled: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      this.donationRepository.find({
        where: { enabled: true },
        order: { sortOrder: 'ASC', label: 'ASC' },
      }),
      this.getSettings(),
    ]);

    const config: ToolsPublicConfig = {
      tools: tools.map((tool) => ({
        slug: tool.slug,
        name: tool.name,
        shortDescription: tool.shortDescription,
        category: tool.category,
        sortOrder: tool.sortOrder,
        enabled: tool.enabled,
        badge: tool.badge,
        // Effective value: both the global switch and the tool's own.
        adsEnabled: settings.adsEnabled && tool.adsEnabled,
      })),
      donationOptions: donationOptions
        .filter((option) => option.url || option.qrisImageUrl)
        .map((option) => ({
          id: option.id,
          label: option.label,
          platform: option.platform,
          url: option.url,
          qrisImageUrl: option.qrisImageUrl,
          note: option.note,
        })),
      settings: {
        adsEnabled: settings.adsEnabled,
        adsenseClientId: settings.adsenseClientId,
        adsenseSlotResult: settings.adsenseSlotResult ?? null,
        adsenseSlotSidebar: settings.adsenseSlotSidebar ?? null,
        blogAdsEnabled: settings.blogAdsEnabled ?? false,
        adsenseSlotArticle: settings.adsenseSlotArticle ?? null,
        donationCtaText: settings.donationCtaText,
      },
    };

    await this.cacheService.setCached(
      CACHE_KEYS.PUBLIC_TOOLS_CONFIG,
      config,
      CACHE_TTL_SECONDS[CACHE_KEYS.PUBLIC_TOOLS_CONFIG],
    );
    return config;
  }

  // ─── Tools ────────────────────────────────────────────────────────────

  findAllTools(): Promise<ToolEntity[]> {
    return this.toolRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createTool(dto: CreateToolDto): Promise<ToolEntity> {
    const existing = await this.toolRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Tool "${dto.slug}" already exists`);
    }
    const saved = await this.toolRepository.save(
      this.toolRepository.create({
        ...dto,
        sortOrder: dto.sortOrder ?? 0,
        enabled: dto.enabled ?? true,
        badge: dto.badge ?? null,
        adsEnabled: dto.adsEnabled ?? true,
      }),
    );
    await this.invalidate();
    return saved;
  }

  async updateTool(id: string, dto: UpdateToolDto): Promise<ToolEntity> {
    const tool = await this.findToolOrThrow(id);
    if (dto.slug && dto.slug !== tool.slug) {
      const clash = await this.toolRepository.findOne({
        where: { slug: dto.slug },
      });
      if (clash) {
        throw new ConflictException(`Tool "${dto.slug}" already exists`);
      }
    }
    Object.assign(tool, dto);
    const saved = await this.toolRepository.save(tool);
    await this.invalidate();
    return saved;
  }

  async reorderTools(ids: string[]): Promise<ToolEntity[]> {
    const tools = await this.toolRepository.find();
    const byId = new Map(tools.map((tool) => [tool.id, tool]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Unknown tool id(s): ${missing.join(', ')}`);
    }
    const updated = ids.map((id, index) => {
      const tool = byId.get(id) as ToolEntity;
      tool.sortOrder = index;
      return tool;
    });
    await this.toolRepository.save(updated);
    await this.invalidate();
    return this.findAllTools();
  }

  async removeTool(id: string): Promise<void> {
    const tool = await this.findToolOrThrow(id);
    await this.toolRepository.remove(tool);
    await this.invalidate();
  }

  // ─── Donation options ────────────────────────────────────────────────

  findAllDonationOptions(): Promise<DonationOptionEntity[]> {
    return this.donationRepository.find({
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
  }

  async createDonationOption(
    dto: CreateDonationOptionDto,
  ): Promise<DonationOptionEntity> {
    const saved = await this.donationRepository.save(
      this.donationRepository.create({
        ...dto,
        url: dto.url ?? null,
        qrisImageUrl: dto.qrisImageUrl ?? null,
        note: dto.note ?? null,
        enabled: dto.enabled ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );
    await this.invalidate();
    return saved;
  }

  async updateDonationOption(
    id: string,
    dto: UpdateDonationOptionDto,
  ): Promise<DonationOptionEntity> {
    const option = await this.findDonationOrThrow(id);
    Object.assign(option, dto);
    const saved = await this.donationRepository.save(option);
    await this.invalidate();
    return saved;
  }

  async removeDonationOption(id: string): Promise<void> {
    const option = await this.findDonationOrThrow(id);
    await this.donationRepository.remove(option);
    await this.invalidate();
  }

  // ─── Settings ─────────────────────────────────────────────────────────

  async getSettings(): Promise<ToolsSettingsEntity> {
    const existing = await this.settingsRepository.find({ take: 1 });
    if (existing.length > 0) return existing[0];
    return this.settingsRepository.save(
      this.settingsRepository.create({
        adsEnabled: false,
        adsenseClientId: null,
        adsenseSlotResult: null,
        adsenseSlotSidebar: null,
        blogAdsEnabled: false,
        adsenseSlotArticle: null,
        donationCtaText: 'Traktir kopi',
        blockedCategoriesNote: null,
      }),
    );
  }

  async updateSettings(
    dto: UpdateToolsSettingsDto,
  ): Promise<ToolsSettingsEntity> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    const saved = await this.settingsRepository.save(settings);
    await this.invalidate();
    return saved;
  }

  // ─── Stats (CMS) ─────────────────────────────────────────────────────

  async getStats(): Promise<{
    usage: ToolUsageStats[];
    donations: DonationClickStats[];
  }> {
    const [usageRows, donationRows] = await Promise.all([
      this.trackingService.getToolUsage(STATS_WINDOW_DAYS),
      this.trackingService.getDonationClicks(STATS_WINDOW_DAYS),
    ]);

    const usage = new Map<string, ToolUsageStats>();
    for (const row of usageRows) {
      const entry = usage.get(row.toolId) ?? {
        toolId: row.toolId,
        views: 0,
        calculations: 0,
      };
      if (row.name === 'tool_view') entry.views += row.count;
      if (row.name === 'tool_calculate') entry.calculations += row.count;
      usage.set(row.toolId, entry);
    }

    const donations = new Map<string, DonationClickStats>();
    for (const row of donationRows) {
      const entry = donations.get(row.donationOptionId) ?? {
        donationOptionId: row.donationOptionId,
        clicks: 0,
        byTool: [],
      };
      entry.clicks += row.count;
      entry.byTool.push({ toolId: row.toolId, clicks: row.count });
      donations.set(row.donationOptionId, entry);
    }

    return { usage: [...usage.values()], donations: [...donations.values()] };
  }

  private invalidate(): Promise<void> {
    return this.cacheService.invalidate(CACHE_KEYS.PUBLIC_TOOLS_CONFIG);
  }

  private async findToolOrThrow(id: string): Promise<ToolEntity> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) throw new NotFoundException('Tool not found');
    return tool;
  }

  private async findDonationOrThrow(id: string): Promise<DonationOptionEntity> {
    const option = await this.donationRepository.findOne({ where: { id } });
    if (!option) throw new NotFoundException('Donation option not found');
    return option;
  }
}
