import { RedisService } from '@enem-landing/backend-redis';
import { SchedulerService } from '@enem-landing/backend-scheduler';
import type { ContactClientSignals } from '@enem-landing/shared-definitions';
import type { ContactSubmissionStatusFilter } from '@enem-landing/shared-types';
import { createAxiosInstance } from '@enem-landing/shared-utils';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  CAPTCHA_FAILED_MESSAGE,
  CaptchaService,
} from '../captcha/captcha.service.js';
import { ContactSubmissionSenderEntity } from './contact-submission-sender.entity.js';
import { ContactSubmissionEntity } from './contact-submission.entity.js';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto.js';
import {
  type ContactRequestContext,
  ContactSenderEnrichmentService,
  type SenderDetails,
} from './sender/contact-sender-enrichment.service.js';
import { evaluateSpam, formatSpamReason } from './spam/contact-spam-rules.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Submissions one email address may send per day. */
const EMAIL_DAILY_LIMIT = 3;
/** Auto-replies sent per day before they pause (relay abuse cap). */
const AUTO_REPLY_DAILY_LIMIT = 50;
/** Sender details are deleted after this many days. */
export const SENDER_RETENTION_DAYS = 90;
const RETENTION_TASK_ID = 'contact-sender-retention';
const RETENTION_CRON = '15 3 * * *'; // daily at 03:15

export interface ContactSubmissionFilter {
  status?: ContactSubmissionStatusFilter;
  ipAddress?: string;
  visitorId?: string;
}

@Injectable()
export class ContactSubmissionsService implements OnModuleInit {
  private readonly logger = new Logger(ContactSubmissionsService.name);

  constructor(
    @InjectRepository(ContactSubmissionEntity)
    private readonly repository: Repository<ContactSubmissionEntity>,
    @InjectRepository(ContactSubmissionSenderEntity)
    private readonly senderRepository: Repository<ContactSubmissionSenderEntity>,
    private readonly captchaService: CaptchaService,
    private readonly redisService: RedisService,
    private readonly enrichmentService: ContactSenderEnrichmentService,
    private readonly schedulerService: SchedulerService,
  ) {}

  onModuleInit(): void {
    this.schedulerService.createCronJob(RETENTION_TASK_ID, RETENTION_CRON, () =>
      this.pruneSenders(),
    );
  }

  /**
   * Stores a submission and answers right away; sender lookups, the spam
   * check and the emails run afterwards. Per-IP limits come from the global
   * RateLimitGuard (`contact` tier on the route).
   */
  async create(
    dto: CreateContactSubmissionDto,
    context: ContactRequestContext,
  ): Promise<ContactSubmissionEntity> {
    if (!(await this.captchaService.consumeToken(dto.captchaToken))) {
      throw new BadRequestException(CAPTCHA_FAILED_MESSAGE);
    }
    await this.assertEmailLimit(dto.email);

    const { fullname, email, phoneNumber, message, client } = dto;
    const saved = await this.repository.save(
      this.repository.create({
        fullname,
        email,
        phoneNumber,
        message,
        readAt: null,
        isSpam: false,
        spamReason: null,
      }),
    );

    // Best-effort: the submission is already stored and visible in the CMS;
    // a failed lookup or SMTP outage must never turn into an error for the
    // visitor.
    void this.processSubmission(saved, client ?? {}, context);
    return saved;
  }

  async processSubmission(
    submission: ContactSubmissionEntity,
    client: ContactClientSignals,
    context: ContactRequestContext,
  ): Promise<void> {
    let details: SenderDetails | null = null;
    try {
      details = await this.enrichmentService.enrich(
        context,
        submission.email,
        submission.phoneNumber,
        client,
      );
      await this.senderRepository.save(
        this.senderRepository.create({
          ...details,
          submissionId: submission.id,
        }),
      );
    } catch (error) {
      this.logger.warn(`Could not record sender details: ${String(error)}`);
    }

    try {
      const verdict = evaluateSpam(submission, details ?? {});
      if (verdict.isSpam) {
        await this.repository.update(submission.id, {
          isSpam: true,
          spamReason: formatSpamReason(verdict.reasons),
        });
        return;
      }
      await this.sendSubmissionEmails(submission, await this.claimAutoReply());
    } catch (error) {
      this.logger.warn(
        `Could not finish processing a submission: ${String(error)}`,
      );
    }
  }

  private async assertEmailLimit(email: string): Promise<void> {
    let count: number;
    try {
      ({ count } = await this.redisService.incrementWindow(
        `contact:email:${email}`,
        DAY_MS,
      ));
    } catch {
      return; // fail open, like the global rate limiter
    }
    if (count > EMAIL_DAILY_LIMIT) {
      throw new HttpException(
        'Too many messages from this email address - please try again tomorrow',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Whether today's auto-reply quota still has room (counts this one). */
  private async claimAutoReply(): Promise<boolean> {
    try {
      const { count } = await this.redisService.incrementWindow(
        'contact:auto-reply',
        DAY_MS,
      );
      if (count > AUTO_REPLY_DAILY_LIMIT) {
        this.logger.warn(
          `Daily auto-reply quota (${AUTO_REPLY_DAILY_LIMIT}) reached, skipping the confirmation email`,
        );
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  private async sendSubmissionEmails(
    submission: ContactSubmissionEntity,
    sendConfirmation: boolean,
  ): Promise<void> {
    try {
      await createAxiosInstance({
        baseURL: process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000',
        customHeaders: {
          'X-Internal-Api-Key': process.env['INTERNAL_API_KEY'] || '',
        },
      }).post('/email/internal/contact-submission', {
        fullname: submission.fullname,
        email: submission.email,
        phoneNumber: submission.phoneNumber,
        message: submission.message,
        sendConfirmation,
      });
    } catch (error) {
      this.logger.warn(
        'Failed to send contact-submission notification/confirmation emails',
        error,
      );
    }
  }

  findAll(
    filter: ContactSubmissionFilter = {},
  ): Promise<ContactSubmissionEntity[]> {
    const query = this.repository
      .createQueryBuilder('submission')
      .leftJoin('submission.sender', 'sender')
      .orderBy('submission.createdAt', 'DESC');

    if (filter.status === 'spam') {
      query.andWhere('submission.isSpam = :isSpam', { isSpam: true });
    } else if (filter.status !== 'all') {
      query.andWhere('submission.isSpam = :isSpam', { isSpam: false });
    }
    if (filter.ipAddress) {
      query.andWhere('sender.ipAddress = :ipAddress', {
        ipAddress: filter.ipAddress,
      });
    }
    if (filter.visitorId) {
      query.andWhere('sender.visitorId = :visitorId', {
        visitorId: filter.visitorId,
      });
    }
    return query.getMany();
  }

  async findDetail(id: string) {
    const submission = await this.repository.findOne({
      where: { id },
      relations: { sender: true },
    });
    if (!submission)
      throw new NotFoundException('Contact submission not found');

    const sender = submission.sender ?? null;
    const countOthers = async (
      column: 'ipAddress' | 'visitorId',
      value: string | null | undefined,
    ) =>
      value
        ? Math.max(
            0,
            (await this.senderRepository.count({
              where: { [column]: value },
            })) - 1,
          )
        : 0;

    return {
      ...submission,
      sender,
      sameIpCount: await countOthers('ipAddress', sender?.ipAddress),
      sameVisitorCount: await countOthers('visitorId', sender?.visitorId),
    };
  }

  async markAsRead(id: string): Promise<ContactSubmissionEntity | null> {
    await this.repository.update(id, { readAt: new Date() });
    return this.repository.findOne({ where: { id } });
  }

  /** Admin override. Never sends the emails a flagged submission skipped. */
  async setSpam(id: string, isSpam: boolean): Promise<ContactSubmissionEntity> {
    const submission = await this.repository.findOne({ where: { id } });
    if (!submission)
      throw new NotFoundException('Contact submission not found');
    await this.repository.update(id, {
      isSpam,
      spamReason: isSpam ? (submission.spamReason ?? 'manual') : null,
    });
    return {
      ...submission,
      isSpam,
      spamReason: isSpam ? (submission.spamReason ?? 'manual') : null,
    };
  }

  async pruneSenders(): Promise<void> {
    const cutoff = new Date(Date.now() - SENDER_RETENTION_DAYS * DAY_MS);
    const result = await this.senderRepository.delete({
      createdAt: LessThan(cutoff),
    });
    this.logger.log(
      `Deleted ${result.affected ?? 0} contact sender records older than ${SENDER_RETENTION_DAYS} days`,
    );
  }
}
