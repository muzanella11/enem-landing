import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeoMetaService } from './seo-meta.service.js';

describe('SeoMetaService', () => {
  let repo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let service: SeoMetaService;

  beforeEach(() => {
    repo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn((entity) => Promise.resolve(entity)),
    };
    service = new SeoMetaService(repo as never);
  });

  it('findByPageKey throws NotFoundException when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findByPageKey('home')).rejects.toThrow(NotFoundException);
  });

  it('upsert creates a new row when the pageKey does not exist', async () => {
    repo.findOne.mockResolvedValue(null);
    const dto = { pageKey: 'home', title: 'Home', description: 'desc' };

    await service.upsert(dto);

    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('upsert merges onto the existing row when the pageKey exists', async () => {
    const existing = { id: '1', pageKey: 'home', title: 'Old' };
    repo.findOne.mockResolvedValue(existing);
    const dto = { pageKey: 'home', title: 'New', description: 'desc' };

    await service.upsert(dto);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: '1', title: 'New' }));
  });

  it('remove deletes an existing entry', async () => {
    const entry = { id: '1', pageKey: 'home' };
    repo.findOne.mockResolvedValue(entry);

    await service.remove('home');

    expect(repo.remove).toHaveBeenCalledWith(entry);
  });
});
