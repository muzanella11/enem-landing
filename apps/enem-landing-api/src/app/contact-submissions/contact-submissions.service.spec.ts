import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactSubmissionsService } from './contact-submissions.service.js';

describe('ContactSubmissionsService', () => {
  let repo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let service: ContactSubmissionsService;

  beforeEach(() => {
    repo = {
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
      find: vi.fn(),
      update: vi.fn(),
      findOne: vi.fn(),
    };
    service = new ContactSubmissionsService(repo as never);
  });

  const dto = {
    fullname: 'A',
    email: 'a@example.com',
    phoneNumber: '0800',
    message: 'Hi',
  };

  it('creates a submission with readAt null', async () => {
    await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith({ ...dto, readAt: null });
  });

  it('findAll orders by createdAt descending', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });

  it('markAsRead sets readAt and returns the updated row', async () => {
    repo.findOne.mockResolvedValue({ id: '1', readAt: new Date() });
    await service.markAsRead('1');
    expect(repo.update).toHaveBeenCalledWith('1', { readAt: expect.any(Date) });
  });
});
