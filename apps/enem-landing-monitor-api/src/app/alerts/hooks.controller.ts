import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Public } from '../auth/public.decorator.js';
import { alertWebhooks } from '../monitor.config.js';
import { AlertService } from './alert.service.js';

/** The body `mysql-backup.sh` already sends (Discord and Slack style). */
class WebhookBody {
  @IsOptional() @IsString() @MaxLength(8000) content?: string;
  @IsOptional() @IsString() @MaxLength(8000) text?: string;
}

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Constant-time, length-independent key comparison. */
export const keyMatches = (
  given: string | undefined,
  expected: string,
): boolean =>
  typeof given === 'string' &&
  given.length > 0 &&
  timingSafeEqual(digest(given), digest(expected));

/**
 * The only route besides `/health` that skips SSO: scripts on the VPS
 * (the daily MySQL backup) report failures here. Each hook has its own id
 * and key (`ALERT_WEBHOOKS`, `id:key`), sent in `X-Webhook-Key`, never in
 * the URL. Body capped at 16 KB by the BFF and the validator, `write` rate
 * limit tier, every call in the audit log (AuditInterceptor plus a line
 * here with the outcome).
 */
@Public()
@RateLimit('write')
@Controller('hooks')
export class HooksController {
  private readonly logger = new Logger('Webhook');

  constructor(private readonly alerts: AlertService) {}

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param('id') id: string,
    @Headers('x-webhook-key') key: string | undefined,
    @Body() body: WebhookBody,
  ) {
    const expected = alertWebhooks().get(id);
    if (!expected) {
      this.logger.warn(`hook=${id} rejected: unknown id`);
      throw new NotFoundException('Unknown webhook');
    }
    if (!keyMatches(key, expected)) {
      this.logger.warn(`hook=${id} rejected: wrong key`);
      throw new UnauthorizedException('Invalid webhook key');
    }
    const text = (body.text || body.content || '').trim();
    if (!text) throw new BadRequestException('content or text is required');
    this.logger.log(`hook=${id} accepted`);

    const definition = await this.alerts.rule('backup-failed');
    if (!definition?.enabled) {
      return successResponse(HttpStatus.OK, 'Rule disabled');
    }
    const entry = await this.alerts.raise({
      ruleId: 'backup-failed',
      key: `backup-failed:${id}`,
      eventId: randomUUID(),
      title: 'Backup MySQL gagal',
      summary: text.slice(0, 2000),
      details: [`Webhook: ${id}`, 'Cek: journalctl -u mysql-backup.service'],
      link: '/uptime',
    });
    return successResponse(HttpStatus.OK, 'Alert recorded', {
      id: entry?.id ?? null,
    });
  }
}
