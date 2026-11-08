import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolsService } from './tools.service.js';

const repoMock = () => ({
  find: vi.fn().mockResolvedValue([]),
  findOne: vi.fn().mockResolvedValue(null),
  create: vi.fn((data) => data),
  save: vi.fn((entity) => Promise.resolve(entity)),
  remove: vi.fn((entity) => Promise.resolve(entity)),
});

describe('ToolsService', () => {
  let toolRepo: ReturnType<typeof repoMock>;
  let donationRepo: ReturnType<typeof repoMock>;
  let settingsRepo: ReturnType<typeof repoMock>;
  let cache: {
    getCached: ReturnType<typeof vi.fn>;
    setCached: ReturnType<typeof vi.fn>;
    invalidate: ReturnType<typeof vi.fn>;
  };
  let tracking: {
    getToolUsage: ReturnType<typeof vi.fn>;
    getDonationClicks: ReturnType<typeof vi.fn>;
  };
  let service: ToolsService;

  beforeEach(() => {
    toolRepo = repoMock();
    donationRepo = repoMock();
    settingsRepo = repoMock();
    settingsRepo.find.mockResolvedValue([
      {
        id: 'settings-1',
        adsEnabled: true,
        adsenseClientId: 'ca-pub-1234567890',
        donationCtaText: 'Traktir kopi',
        blockedCategoriesNote: null,
      },
    ]);
    cache = {
      getCached: vi.fn().mockResolvedValue(null),
      setCached: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    };
    tracking = {
      getToolUsage: vi.fn().mockResolvedValue([]),
      getDonationClicks: vi.fn().mockResolvedValue([]),
    };
    service = new ToolsService(
      toolRepo as never,
      donationRepo as never,
      settingsRepo as never,
      cache as never,
      tracking as never,
    );
  });

  describe('getPublicConfig', () => {
    it('serves the cached config without touching the DB', async () => {
      const cached = { tools: [], donationOptions: [], settings: {} };
      cache.getCached.mockResolvedValue(cached);
      await expect(service.getPublicConfig()).resolves.toBe(cached);
      expect(toolRepo.find).not.toHaveBeenCalled();
    });

    it('combines the global and per-tool ad switches', async () => {
      toolRepo.find.mockResolvedValue([
        { slug: 'a', name: 'A', adsEnabled: true, enabled: true },
        { slug: 'b', name: 'B', adsEnabled: false, enabled: true },
      ]);
      const config = await service.getPublicConfig();
      expect(config.tools.map((tool) => tool.adsEnabled)).toEqual([
        true,
        false,
      ]);

      settingsRepo.find.mockResolvedValue([
        { id: 's', adsEnabled: false, donationCtaText: 'x' },
      ]);
      const offConfig = await service.getPublicConfig();
      expect(offConfig.tools.every((tool) => !tool.adsEnabled)).toBe(true);
    });

    it('only lists enabled tools and hides donation options without a link or QRIS', async () => {
      donationRepo.find.mockResolvedValue([
        {
          id: 'd1',
          label: 'SociaBuzz',
          platform: 'sociabuzz',
          url: null,
          qrisImageUrl: null,
        },
        {
          id: 'd2',
          label: 'SociaBuzz',
          platform: 'sociabuzz',
          url: 'https://sociabuzz.com/x/tribe',
          qrisImageUrl: null,
        },
      ]);
      const config = await service.getPublicConfig();
      expect(toolRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { enabled: true } }),
      );
      expect(config.donationOptions.map((option) => option.id)).toEqual(['d2']);
      expect(cache.setCached).toHaveBeenCalled();
    });
  });

  it('createTool rejects a duplicate slug', async () => {
    toolRepo.findOne.mockResolvedValue({ id: 't1', slug: 'terbilang' });
    await expect(
      service.createTool({
        slug: 'terbilang',
        name: 'Terbilang',
        shortDescription: 'x',
        category: 'keuangan',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updateTool invalidates the public config cache', async () => {
    toolRepo.findOne.mockResolvedValue({
      id: 't1',
      slug: 'terbilang',
      enabled: true,
    });
    await service.updateTool('t1', { enabled: false });
    expect(toolRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(cache.invalidate).toHaveBeenCalledWith('cache:public:tools-config');
  });

  it('reorderTools assigns sortOrder from the given order', async () => {
    toolRepo.find.mockResolvedValue([
      { id: 'a', sortOrder: 0 },
      { id: 'b', sortOrder: 1 },
    ]);
    await service.reorderTools(['b', 'a']);
    expect(toolRepo.save).toHaveBeenCalledWith([
      { id: 'b', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
    ]);
  });

  it('reorderTools rejects unknown ids', async () => {
    toolRepo.find.mockResolvedValue([{ id: 'a', sortOrder: 0 }]);
    await expect(service.reorderTools(['a', 'zzz'])).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getStats folds event rows into per-tool and per-option totals', async () => {
    tracking.getToolUsage.mockResolvedValue([
      { toolId: 'kpr', name: 'tool_view', count: 10 },
      { toolId: 'kpr', name: 'tool_calculate', count: 4 },
    ]);
    tracking.getDonationClicks.mockResolvedValue([
      { donationOptionId: 'd1', toolId: 'kpr', count: 2 },
      { donationOptionId: 'd1', toolId: 'zakat', count: 1 },
    ]);

    const stats = await service.getStats();

    expect(stats.usage).toEqual([
      { toolId: 'kpr', views: 10, calculations: 4 },
    ]);
    expect(stats.donations).toEqual([
      {
        donationOptionId: 'd1',
        clicks: 3,
        byTool: [
          { toolId: 'kpr', clicks: 2 },
          { toolId: 'zakat', clicks: 1 },
        ],
      },
    ]);
  });

  it('serves the AdSense ad unit ids in the public config (Story 27)', async () => {
    settingsRepo.find.mockResolvedValue([
      {
        id: 's',
        adsEnabled: true,
        adsenseClientId: 'ca-pub-1234567890',
        adsenseSlotResult: '1111111111',
        adsenseSlotSidebar: null,
        donationCtaText: 'Traktir kopi',
      },
    ]);
    const config = await service.getPublicConfig();
    expect(config.settings.adsenseSlotResult).toBe('1111111111');
    expect(config.settings.adsenseSlotSidebar).toBeNull();
  });

  it('serves the blog ad switch and article slot in the public config (Story 56)', async () => {
    settingsRepo.find.mockResolvedValue([
      {
        id: 's',
        adsEnabled: true,
        adsenseClientId: 'ca-pub-1234567890',
        blogAdsEnabled: true,
        adsenseSlotArticle: '2222222222',
        donationCtaText: 'Traktir kopi',
      },
    ]);
    const config = await service.getPublicConfig();
    expect(config.settings.blogAdsEnabled).toBe(true);
    expect(config.settings.adsenseSlotArticle).toBe('2222222222');
  });

  it('defaults the blog ad fields when the row predates Story 56', async () => {
    const config = await service.getPublicConfig();
    expect(config.settings.blogAdsEnabled).toBe(false);
    expect(config.settings.adsenseSlotArticle).toBeNull();
  });
});
