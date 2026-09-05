import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackingSettingsService } from './tracking-settings.service.js';

describe('TrackingSettingsService', () => {
  let repo: {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let cache: {
    getCached: ReturnType<typeof vi.fn>;
    setCached: ReturnType<typeof vi.fn>;
    invalidate: ReturnType<typeof vi.fn>;
  };
  let service: TrackingSettingsService;

  beforeEach(() => {
    repo = {
      find: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve({ id: 'row-1', ...entity })),
    };
    cache = {
      getCached: vi.fn().mockResolvedValue(null),
      setCached: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    };
    service = new TrackingSettingsService(repo as never, cache as never);
  });

  it('returns the cached value without touching the repository', async () => {
    const cached = { id: 'row-1', pageviewEnabled: true };
    cache.getCached.mockResolvedValue(cached);

    await expect(service.getOrCreate()).resolves.toBe(cached);
    expect(repo.find).not.toHaveBeenCalled();
  });

  it('creates a default row with every feature disabled when none exists', async () => {
    repo.find.mockResolvedValue([]);

    const result = await service.getOrCreate();

    expect(repo.create).toHaveBeenCalledWith({
      pageviewEnabled: false,
      eventsEnabled: false,
      heatmapEnabled: false,
      sessionRecordingEnabled: false,
      sessionRecordingSampleRatePct: 10,
    });
    expect(result.id).toBe('row-1');
    expect(cache.setCached).toHaveBeenCalled();
  });

  it('update merges the dto onto the existing row and invalidates the cache', async () => {
    repo.find.mockResolvedValue([{ id: 'row-1', pageviewEnabled: false }]);
    const dto = {
      pageviewEnabled: true,
      eventsEnabled: false,
      heatmapEnabled: false,
      sessionRecordingEnabled: false,
    };

    await service.update(dto);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ pageviewEnabled: true }),
    );
    expect(cache.invalidate).toHaveBeenCalledWith(
      'cache:public:tracking-config',
    );
  });
});
