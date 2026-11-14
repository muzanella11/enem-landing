import { createAxiosInstance } from '@enem-landing/shared-utils';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmissionEntity } from './contact-submission.entity.js';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto.js';

@Injectable()
export class ContactSubmissionsService {
  private readonly logger = new Logger(ContactSubmissionsService.name);

  constructor(
    @InjectRepository(ContactSubmissionEntity)
    private readonly repository: Repository<ContactSubmissionEntity>,
  ) {}

  // Per-IP limits come from the global RateLimitGuard (`contact` tier on
  // the controller route).
  async create(
    dto: CreateContactSubmissionDto,
  ): Promise<ContactSubmissionEntity> {
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
