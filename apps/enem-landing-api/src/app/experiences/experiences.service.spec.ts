import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExperiencesService } from './experiences.service.js';

describe('ExperiencesService', () => {
  let experiencesRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let projectsRepo: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let service: ExperiencesService;

  beforeEach(() => {
    experiencesRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn((entity) => Promise.resolve(entity)),
    };
    projectsRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn((entity) => Promise.resolve(entity)),
    };
    service = new ExperiencesService(
      experiencesRepo as never,
      projectsRepo as never,
    );
  });

  it('findAll orders by createdAt ascending with projects joined', async () => {
    await service.findAll();
    expect(experiencesRepo.find).toHaveBeenCalledWith({
      relations: ['projects'],
      order: { createdAt: 'ASC' },
    });
  });

  it('findOne throws NotFoundException when missing', async () => {
    experiencesRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('create persists the experience with nested projects via cascade', async () => {
    const dto = { company: 'Acme', projects: [{ title: 'X' }] };
    await service.create(dto as never);
    expect(experiencesRepo.create).toHaveBeenCalledWith(dto);
    expect(experiencesRepo.save).toHaveBeenCalled();
  });

  it('update merges dto fields onto the existing experience', async () => {
    const existing = { id: '1', company: 'Old' };
    experiencesRepo.findOne.mockResolvedValue(existing);
    await service.update('1', { company: 'New' } as never);
    expect(experiencesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ company: 'New' }),
    );
  });

  it('createProject throws when the parent experience does not exist', async () => {
    experiencesRepo.findOne.mockResolvedValue(null);
    await expect(
      service.createProject('missing', { title: 'X' } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('createProject attaches the experienceId to the new project', async () => {
    experiencesRepo.findOne.mockResolvedValue({ id: 'exp-1' });
    await service.createProject('exp-1', { title: 'X' } as never);
    expect(projectsRepo.create).toHaveBeenCalledWith({
      title: 'X',
      experienceId: 'exp-1',
    });
  });

  it('updateProject throws when the project does not exist', async () => {
    projectsRepo.findOne.mockResolvedValue(null);
    await expect(service.updateProject('missing', {} as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removeProject deletes an existing project', async () => {
    const project = { id: 'proj-1' };
    projectsRepo.findOne.mockResolvedValue(project);
    await service.removeProject('proj-1');
    expect(projectsRepo.remove).toHaveBeenCalledWith(project);
  });
});
