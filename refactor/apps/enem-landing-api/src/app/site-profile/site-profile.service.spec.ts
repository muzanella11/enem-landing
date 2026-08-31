import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteProfileService } from './site-profile.service.js';

describe('SiteProfileService', () => {
  let repo: {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let service: SiteProfileService;

  beforeEach(() => {
    repo = {
      find: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve({ id: 'row-1', ...entity })),
    };
    service = new SiteProfileService(repo as never);
  });

  it('returns the existing row when one exists', async () => {
    const existing = { id: 'row-1', heroTitle: 'Hi' };
    repo.find.mockResolvedValue([existing]);

    await expect(service.getOrCreate()).resolves.toBe(existing);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates a default row when none exists', async () => {
    repo.find.mockResolvedValue([]);

    const result = await service.getOrCreate();

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ heroTitle: '', socialLinks: [] }),
    );
    expect(result.id).toBe('row-1');
  });

  it('update merges the dto onto the existing (or newly created) row', async () => {
    repo.find.mockResolvedValue([{ id: 'row-1', heroTitle: 'Old' }]);
    const dto = { heroTitle: 'New', heroSubtitle: '', bio: '', avatarUrl: '', socialLinks: [] };

    await service.update(dto);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ heroTitle: 'New' }));
  });
});
