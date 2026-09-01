import { HttpException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  afterEach(() => {
    service.onModuleDestroy();
  });

  const dto = { fullname: 'A', email: 'a@example.com', phoneNumber: '0800', message: 'Hi' };

  it('creates a submission with readAt null', async () => {
    await service.create(dto, '1.2.3.4');
    expect(repo.create).toHaveBeenCalledWith({ ...dto, readAt: null });
  });

  it('allows up to 5 submissions per IP within the window', async () => {
    for (let i = 0; i < 5; i += 1) {
      await expect(service.create(dto, '1.2.3.4')).resolves.toBeDefined();
    }
  });

  it('rejects the 6th submission from the same IP within the window', async () => {
    for (let i = 0; i < 5; i += 1) {
      await service.create(dto, '1.2.3.4');
    }
    await expect(service.create(dto, '1.2.3.4')).rejects.toThrow(HttpException);
  });

  it('tracks rate limits independently per IP', async () => {
    for (let i = 0; i < 5; i += 1) {
      await service.create(dto, '1.2.3.4');
    }
    await expect(service.create(dto, '5.6.7.8')).resolves.toBeDefined();
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
