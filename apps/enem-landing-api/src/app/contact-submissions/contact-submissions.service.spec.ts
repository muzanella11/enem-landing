import { BadRequestException, HttpException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactSubmissionsService } from './contact-submissions.service.js';

const post = vi.fn();
vi.mock('@enem-landing/shared-utils', () => ({
  createAxiosInstance: () => ({ post }),
}));

describe('ContactSubmissionsService', () => {
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let senderRepo: Record<string, ReturnType<typeof vi.fn>>;
  let captcha: { consumeToken: ReturnType<typeof vi.fn> };
  let redis: { incrementWindow: ReturnType<typeof vi.fn> };
  let enrichment: { enrich: ReturnType<typeof vi.fn> };
  let service: ContactSubmissionsService;

  const dto = {
    fullname: 'Budi Santoso',
    email: 'budi@example.com',
    phoneNumber: '081234567890',
    message: 'Halo, saya ingin diskusi soal pembuatan website.',
    captchaToken: 'token',
    client: { timezone: 'Asia/Jakarta' },
  };
  const context = { ip: '203.0.113.7', userAgent: 'UA' };

  beforeEach(() => {
    post.mockReset().mockResolvedValue({});
    repo = {
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve({ id: 's1', ...entity })),
      update: vi.fn(),
      findOne: vi.fn(),
    };
    senderRepo = {
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
      count: vi.fn(),
      delete: vi.fn().mockResolvedValue({ affected: 2 }),
    };
    captcha = { consumeToken: vi.fn().mockResolvedValue(true) };
    redis = {
      incrementWindow: vi.fn().mockResolvedValue({ count: 1, ttlMs: 1000 }),
    };
    enrichment = {
      enrich: vi.fn().mockResolvedValue({ ipAddress: '203.0.113.7' }),
    };
    service = new ContactSubmissionsService(
      repo as never,
      senderRepo as never,
      captcha as never,
      redis as never,
      enrichment as never,
      { createCronJob: vi.fn() } as never,
    );
  });

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('stores only the form fields, never the captcha token or signals', async () => {
    await service.create(dto, context);
    expect(repo.create).toHaveBeenCalledWith({
      fullname: dto.fullname,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      message: dto.message,
      readAt: null,
      isSpam: false,
      spamReason: null,
    });
  });

  it('rejects a submission without a solved captcha', async () => {
    captcha.consumeToken.mockResolvedValue(false);
    await expect(service.create(dto, context)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('limits one email address to 3 submissions a day', async () => {
    redis.incrementWindow.mockResolvedValue({ count: 4, ttlMs: 1000 });
    const error = await service.create(dto, context).catch((caught) => caught);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
  });

  it('records the sender and emails a clean submission with the auto-reply', async () => {
    await service.create(dto, context);
    await flush();
    expect(enrichment.enrich).toHaveBeenCalledWith(
      context,
      dto.email,
      dto.phoneNumber,
      dto.client,
    );
    expect(senderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ submissionId: 's1', ipAddress: '203.0.113.7' }),
    );
    expect(post).toHaveBeenCalledWith(
      '/email/internal/contact-submission',
      expect.objectContaining({ email: dto.email, sendConfirmation: true }),
    );
  });

  it('flags spam and sends no email at all', async () => {
    await service.create(
      {
        ...dto,
        message:
          "We drive targeted traffic within 24 hours. Is this something you'd like to explore?",
      },
      context,
    );
    await flush();
    expect(repo.update).toHaveBeenCalledWith('s1', {
      isSpam: true,
      spamReason: expect.stringContaining('phrases:'),
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('skips the auto-reply once the daily quota is used up', async () => {
    redis.incrementWindow
      .mockResolvedValueOnce({ count: 1, ttlMs: 1000 }) // email limit
      .mockResolvedValueOnce({ count: 51, ttlMs: 1000 }); // auto-reply quota
    await service.create(dto, context);
    await flush();
    expect(post).toHaveBeenCalledWith(
      '/email/internal/contact-submission',
      expect.objectContaining({ sendConfirmation: false }),
    );
  });

  it('still emails when the sender lookup fails', async () => {
    enrichment.enrich.mockRejectedValue(new Error('lookup down'));
    await service.create(dto, context);
    await flush();
    expect(post).toHaveBeenCalled();
  });

  it('clears the reason when an admin marks a submission as not spam', async () => {
    repo.findOne.mockResolvedValue({ id: 's1', isSpam: true, spamReason: 'x' });
    await expect(service.setSpam('s1', false)).resolves.toMatchObject({
      isSpam: false,
      spamReason: null,
    });
    expect(repo.update).toHaveBeenCalledWith('s1', {
      isSpam: false,
      spamReason: null,
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('counts other submissions from the same IP and visitor', async () => {
    repo.findOne.mockResolvedValue({
      id: 's1',
      sender: { ipAddress: '203.0.113.7', visitorId: 'v1' },
    });
    senderRepo.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    await expect(service.findDetail('s1')).resolves.toMatchObject({
      sameIpCount: 2,
      sameVisitorCount: 0,
    });
  });

  it('deletes sender records past the retention window', async () => {
    await service.pruneSenders();
    expect(senderRepo.delete).toHaveBeenCalledWith({
      createdAt: expect.anything(),
    });
  });
});
