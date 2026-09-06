import { benchmark } from '@enem-landing/shared-utils';
import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { SmtpConfig } from './smtp-config.js';

export interface SendMailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

/** Ported from mau-apps' `libs/backend/email/src/lib/email.service.ts`, trimmed to what enem-landing actually sends (no cc/bcc/attachments - neither template here needs them). */
@Injectable()
export class EmailService {
  private readonly constructorName = this.constructor.name;

  private createTransporter(config: SmtpConfig): Transporter {
    const username = config.username?.trim();

    return nodemailer.createTransport({
      host: config.host.trim(),
      port: config.port,
      secure: config.secure,
      auth: username
        ? { user: username, pass: config.password?.trim() }
        : undefined,
    });
  }

  async verifyConnection(config: SmtpConfig): Promise<boolean> {
    return benchmark(`${this.constructorName}@verifyConnection`, async () => {
      try {
        await this.createTransporter(config).verify();
        return true;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to verify SMTP connection: ${detail}`);
      }
    });
  }

  async sendMail(
    config: SmtpConfig,
    payload: SendMailPayload,
  ): Promise<{ messageId: string }> {
    return benchmark(`${this.constructorName}@sendMail`, async () => {
      const info = await this.createTransporter(config).sendMail({
        from: `"${config.fromName.trim()}" <${config.fromEmail.trim()}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return { messageId: info.messageId };
    });
  }
}
