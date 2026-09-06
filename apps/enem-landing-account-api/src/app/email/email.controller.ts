import { Role } from '@enem-landing/shared-definitions';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import type { AuthJwtPayload } from '../auth/auth-jwt-payload.js';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard.js';
import { SystemSettingsService } from '../system-settings/system-settings.service.js';
import { InternalApiGuard } from '../uploads/guard/internal-api.guard.js';
import { SendContactSubmissionEmailDto } from './dto/send-contact-submission-email.dto.js';
import { SendTestEmailDto } from './dto/send-test-email.dto.js';
import { EmailService } from './email.service.js';
import {
  adminNotificationEmailsFromSettings,
  smtpConfigFromSettings,
} from './smtp-config-from-settings.js';
import { ContactSubmissionAdminTemplate } from './templates/contact-submission-admin.template.js';
import { ContactSubmissionConfirmationTemplate } from './templates/contact-submission-confirmation.template.js';
import { TestEmailTemplate } from './templates/test-email.template.js';

const assertAdmin = (user: AuthJwtPayload): void => {
  if (user.role !== Role.Admin && user.role !== Role.SuperAdmin) {
    throw new ForbiddenException('Admin access required');
  }
};

@Controller('email')
export class EmailController {
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
    return { statusCode: 200, message: `Test email sent to ${to}` };
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
      (() => {
        const template = new ContactSubmissionConfirmationTemplate(dto);
        return this.emailService.sendMail(config, {
          to: dto.email,
          subject: template.subject,
          html: template.generateHtml(),
        });
      })(),
    ]);

    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    return {
      statusCode: 200,
      message:
        failures.length === 0
          ? 'Emails sent'
          : `${failures.length}/${results.length} email(s) failed to send`,
    };
  }
}
