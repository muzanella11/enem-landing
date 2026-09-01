import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillsService } from './skills.service.js';

describe('SkillsService', () => {
  let repo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let service: SkillsService;

  beforeEach(() => {
    repo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn((entity) => Promise.resolve(entity)),
    };
    service = new SkillsService(repo as never);
  });

  it('findAll orders by category then name', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({
      order: { category: 'ASC', name: 'ASC' },
    });
  });

  it('create defaults level/icon to null when omitted', async () => {
    await service.create({ name: 'TypeScript', category: 'Languages' });
    expect(repo.create).toHaveBeenCalledWith({
      name: 'TypeScript',
      category: 'Languages',
      level: null,
      icon: null,
    });
  });

  it('update throws NotFoundException when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.update('missing', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove throws NotFoundException when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });

  it('remove deletes an existing skill', async () => {
    const skill = { id: '1' };
    repo.findOne.mockResolvedValue(skill);
    await service.remove('1');
    expect(repo.remove).toHaveBeenCalledWith(skill);
  });
});
