import type { MonitorAlertEmailPayload } from '@enem-landing/shared-types';
import { Injectable } from '@nestjs/common';
import { accountApiHost, internalApiKey } from '../monitor.config.js';

export type MailResult =
  | { status: 'sent' }
  | { status: 'cms-disabled' }
  | { status: 'error'; error: string };

/**
 * Same path as the contact form's admin email: account-api's internal
 * endpoint with `X-Internal-Api-Key`, which sends through the SMTP set in
 * CMS Settings to ADMIN_NOTIFICATION_EMAIL. This app never sees SMTP
 * credentials or recipients.
 */
@Injectable()
export class AlertMailer {
  async send(payload: MonitorAlertEmailPayload): Promise<MailResult> {
    if (!internalApiKey()) {
      return { status: 'error', error: 'INTERNAL_API_KEY is not set' };
    }
    try {
      const response = await fetch(
        new URL('/email/internal/monitor-alert', accountApiHost()),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Api-Key': internalApiKey(),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30_000),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
        data?: { sent?: boolean; reason?: string };
      };
      if (!response.ok) {
        const message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
        return {
          status: 'error',
          error: `account-api ${response.status}: ${message ?? 'request failed'}`,
        };
      }
      if (body.data?.sent === false && body.data.reason === 'cms-disabled') {
        return { status: 'cms-disabled' };
      }
      return { status: 'sent' };
    } catch (error) {
      return {
        status: 'error',
        error: `account-api unreachable: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
