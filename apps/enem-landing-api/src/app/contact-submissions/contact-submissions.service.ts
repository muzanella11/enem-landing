import { createAxiosInstance } from '@enem-landing/shared-utils';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmissionEntity } from './contact-submission.entity.js';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto.js';

/**
 * Ported from mau-apps' actual rate-limit pattern
 * (`mau-undang-api/src/app/invitation-wishes/invitation-wishes.service.ts`)
 * — an in-memory fixed-window counter, not `@nestjs/throttler`/Redis (that
 * package isn't used anywhere in mau-apps; the original Story 06 plan
 * assumed it was, verified and corrected before implementing). Basic,
 * single-instance only by design — see the story doc for the documented
 * upgrade path (`libs/backend/redis`) if enem-landing-api ever runs more
 * than one replica.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

@Injectable()
export class ContactSubmissionsService implements OnModuleDestroy {
  private readonly logger = new Logger(ContactSubmissionsService.name);
  private readonly rateLimitMap = new Map<
    string,
    { count: number; windowStart: number }
  >();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(
    @InjectRepository(ContactSubmissionEntity)
    private readonly repository: Repository<ContactSubmissionEntity>,
  ) {
    this.cleanupTimer = setInterval(
      () => this.pruneRateLimitMap(),
      RATE_LIMIT_WINDOW_MS * 5,
    ).unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
  }

  private pruneRateLimitMap(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitMap) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS)
        this.rateLimitMap.delete(key);
    }
  }

  private assertRateLimit(ip: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(ip);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      this.rateLimitMap.set(ip, { count: 1, windowStart: now });
      return;
    }

    if (entry.count >= RATE_LIMIT_MAX_SUBMISSIONS) {
      throw new HttpException(
        'Too many submissions, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
  }

  async create(
    dto: CreateContactSubmissionDto,
    ip: string,
  ): Promise<ContactSubmissionEntity> {
    this.assertRateLimit(ip);
    const submission = this.repository.create({ ...dto, readAt: null });
    const saved = await this.repository.save(submission);
    // Best-effort: a submission is fully persisted and visible in the CMS
    // regardless of whether the notification/confirmation emails send -
    // an SMTP outage or misconfiguration must never turn into a 500 for
    // the visitor submitting the form.
    void this.sendSubmissionEmails(dto);
    return saved;
  }

  private async sendSubmissionEmails(
    dto: CreateContactSubmissionDto,
  ): Promise<void> {
    try {
      await createAxiosInstance({
        baseURL: process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000',
        customHeaders: {
          'X-Internal-Api-Key': process.env['INTERNAL_API_KEY'] || '',
        },
      }).post('/email/internal/contact-submission', dto);
    } catch (error) {
      this.logger.warn(
        'Failed to send contact-submission notification/confirmation emails',
        error,
      );
    }
  }

  findAll(): Promise<ContactSubmissionEntity[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async markAsRead(id: string): Promise<ContactSubmissionEntity | null> {
    await this.repository.update(id, { readAt: new Date() });
    return this.repository.findOne({ where: { id } });
  }
}
