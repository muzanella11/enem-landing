import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoldPriceService } from './gold-price.service.js';

describe('GoldPriceService', () => {
  let repo: {
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };
  let service: GoldPriceService;

  beforeEach(() => {
    repo = {
      save: vi.fn(),
      create: vi.fn((data) => data),
      find: vi.fn().mockResolvedValue([]),
    };
    service = new GoldPriceService(
      repo as never,
      { createCronJob: vi.fn(), runWithLock: vi.fn() } as never,
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('uses the WIB calendar date', () => {
    expect(GoldPriceService.todayWib(new Date('2026-11-05T18:00:00Z'))).toBe(
      '2026-11-06',
    );
    expect(GoldPriceService.todayWib(new Date('2026-11-05T16:00:00Z'))).toBe(
      '2026-11-05',
    );
  });

  it('records spot USD/oz x USD/IDR per gram', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes('gold-api')
            ? { price: 3110.34768, updatedAt: '2026-11-06T03:00:00Z' }
            : { rates: { IDR: 16_000 } },
      })),
    );
    await service.recordToday();
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ pricePerGram: 1_600_000 }),
    );
  });

  it('does not throw or save when a source fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );
    await expect(service.recordToday()).resolves.toBeUndefined();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
