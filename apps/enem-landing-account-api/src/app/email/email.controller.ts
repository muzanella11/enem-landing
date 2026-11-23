import { successResponse } from '@enem-landing/backend-utils';
import { Role } from '@enem-landing/shared-definitions';
import {
  BadGatewayException,
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  Logger,
  Post,
  Request,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import type { AuthJwtPayload } from '../auth/auth-jwt-payload.js';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard.js';
import { SystemSettingsService } from '../system-settings/system-settings.service.js';
import { InternalApiGuard } from '../uploads/guard/internal-api.guard.js';
import { SendContactSubmissionEmailDto } from './dto/send-contact-submission-email.dto.js';
import { SendMonitorAlertEmailDto } from './dto/send-monitor-alert-email.dto.js';
import { SendTestEmailDto } from './dto/send-test-email.dto.js';
import { EmailService } from './email.service.js';
import {
  adminNotificationEmailsFromSettings,
  smtpConfigFromSettings,
} from './smtp-config-from-settings.js';
import { ContactSubmissionAdminTemplate } from './templates/contact-submission-admin.template.js';
import { ContactSubmissionConfirmationTemplate } from './templates/contact-submission-confirmation.template.js';
import {
  type MonitorAlertPayload,
  MonitorAlertTemplate,
} from './templates/monitor-alert.template.js';
import { TestEmailTemplate } from './templates/test-email.template.js';

/** CMS Settings switch (system_settings), checked on every alert so it applies without a redeploy. */
export const MONITOR_ALERT_EMAIL_ENABLED = 'MONITOR_ALERT_EMAIL_ENABLED';

const assertAdmin = (user: AuthJwtPayload): void => {
  if (user.role !== Role.Admin && user.role !== Role.SuperAdmin) {
    throw new ForbiddenException('Admin access required');
  }
};

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  /** CMS Settings page's "Send Test Email" button - verifies the currently-saved SMTP config actually works. */
  @UseGuards(JwtAuthGuard)
  @Post('test')
  async sendTest(
    @Request() req: ExpressRequest,
    @Body() dto: SendTestEmailDto,
  ) {
    assertAdmin(req.user as AuthJwtPayload);

    const settings = await this.systemSettingsService.getAll();
    const config = smtpConfigFromSettings(settings);
    const to = dto.to || adminNotificationEmailsFromSettings(settings)[0];
    if (!to) {
      throw new BadRequestException(
        'No recipient: pass `to` or configure ADMIN_NOTIFICATION_EMAIL first',
      );
    }

    const template = new TestEmailTemplate({
      host: config.host,
      port: config.port,
      secure: config.secure,
    });
    await this.emailService.sendMail(config, {
      to,
      subject: template.subject,
      html: template.generateHtml(),
    });
    return successResponse(HttpStatus.CREATED, `Test email sent to ${to}`);
  }

  /**
   * Server-to-server counterpart used by enem-landing-api's
   * ContactSubmissionsService - sends both the admin notification and the
   * submitter's auto-reply confirmation from one call, since both use the
   * same SMTP config this service already owns (system_settings).
   */
  @UseGuards(InternalApiGuard)
  @Post('internal/contact-submission')
  async sendContactSubmissionEmails(
    @Body() dto: SendContactSubmissionEmailDto,
  ) {
    const settings = await this.systemSettingsService.getAll();
    const config = smtpConfigFromSettings(settings);
    const adminEmails = adminNotificationEmailsFromSettings(settings);

    const results = await Promise.allSettled([
      ...(adminEmails.length > 0
        ? [
            (() => {
              const template = new ContactSubmissionAdminTemplate(dto);
              return this.emailService.sendMail(config, {
                to: adminEmails,
                subject: template.subject,
                html: template.generateHtml(),
              });
            })(),
          ]
        : []),
      ...(dto.sendConfirmation === false
        ? []
        : [
            (() => {
              const template = new ContactSubmissionConfirmationTemplate(dto);
              return this.emailService.sendMail(config, {
                to: dto.email,
                subject: template.subject,
                html: template.generateHtml(),
              });
            })(),
          ]),
    ]);

    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    return successResponse(
      HttpStatus.CREATED,
      failures.length === 0
        ? 'Emails sent'
        : `${failures.length}/${results.length} email(s) failed to send`,
    );
  }

  /**
   * enem-landing-monitor-api's alert outbox. The recipient is always
   * ADMIN_NOTIFICATION_EMAIL from CMS Settings (no `to` in the body).
   * Answers `{ sent: false, reason: 'cms-disabled' }` when the CMS switch is
   * off (the monitor records that and does not retry), 409 when no admin
   * email is set and 502 when SMTP fails (both retried by the monitor).
   */
  @UseGuards(InternalApiGuard)
  @Post('internal/monitor-alert')
  @HttpCode(HttpStatus.OK)
  async sendMonitorAlert(@Body() dto: SendMonitorAlertEmailDto) {
    const settings = await this.systemSettingsService.getAll();
    if (settings[MONITOR_ALERT_EMAIL_ENABLED] !== 'true') {
      return successResponse(HttpStatus.OK, 'Monitor alert email is off', {
        sent: false,
        reason: 'cms-disabled',
      });
    }
    await this.deliverMonitorAlert(settings, dto);
    return successResponse(HttpStatus.OK, 'Monitor alert sent', {
      sent: true,
    });
  }

  /** CMS Settings' "Kirim email alert tes": a sample alert, sent even while the switch is off. */
  @UseGuards(JwtAuthGuard)
  @Post('monitor-alert/test')
  async sendMonitorAlertTest(@Request() req: ExpressRequest) {
    assertAdmin(req.user as AuthJwtPayload);
    const settings = await this.systemSettingsService.getAll();
    const enabled = settings[MONITOR_ALERT_EMAIL_ENABLED] === 'true';
    const to = await this.deliverMonitorAlert(settings, {
      title: 'Email alert tes',
      severity: 'info',
      kind: 'firing',
      environment: 'test',
      time: new Date().toISOString(),
      summary: enabled
        ? 'Email alert monitor aktif. Alert sungguhan akan dikirim ke alamat ini.'
        : 'Email alert monitor masih nonaktif di CMS Settings. Alert sungguhan tidak dikirim sampai saklarnya dinyalakan.',
      details: ['Dikirim dari halaman Settings CMS.'],
      url: 'https://monitor.muzanella.com/alerts',
    });
    return successResponse(
      HttpStatus.CREATED,
      `Monitor alert test sent to ${to.join(', ')}${enabled ? '' : ' (switch is still off)'}`,
    );
  }

  private async deliverMonitorAlert(
    settings: Record<string, string>,
    payload: MonitorAlertPayload,
  ): Promise<string[]> {
    const to = adminNotificationEmailsFromSettings(settings);
    if (to.length === 0) {
      throw new ConflictException(
        'ADMIN_NOTIFICATION_EMAIL is not set in CMS Settings',
      );
    }
    const template = new MonitorAlertTemplate(payload);
    try {
      await this.emailService.sendMail(smtpConfigFromSettings(settings), {
        to,
        subject: template.subject,
        html: template.generateHtml(),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Monitor alert email failed: ${detail}`);
      throw new BadGatewayException(`SMTP error: ${detail.slice(0, 300)}`);
    }
    return to;
  }
}
