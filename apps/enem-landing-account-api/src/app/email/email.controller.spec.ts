import { ConflictException, BadGatewayException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { EmailController } from './email.controller.js';
import type { EmailService } from './email.service.js';
import type { SystemSettingsService } from '../system-settings/system-settings.service.js';

const dto = {
  title: 'MySQL tidak jalan',
  severity: 'critical' as const,
  kind: 'firing' as const,
  environment: 'prod',
  time: '2026-11-23T10:00:00.000Z',
  summary: 'mysql_mysql',
  details: [],
  url: 'https://monitor.muzanella.com/db',
};

const build = (settings: Record<string, string>, sendMail = vi.fn()) => {
  const controller = new EmailController(
    { sendMail } as unknown as EmailService,
    { getAll: async () => settings } as unknown as SystemSettingsService,
  );
  return { controller, sendMail };
};

describe('EmailController monitor alert', () => {
  it('sends to ADMIN_NOTIFICATION_EMAIL only', async () => {
    const { controller, sendMail } = build({
      MONITOR_ALERT_EMAIL_ENABLED: 'true',
      ADMIN_NOTIFICATION_EMAIL: 'a@example.com, b@example.com',
      SMTP_HOST: 'smtp.example.com',
    });
    const response = await controller.sendMonitorAlert({
      ...dto,
      // Not part of the DTO: must never change the recipient.
      ...({ to: 'attacker@example.com' } as object),
    });
    expect(response.data).toEqual({ sent: true });
    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][1].to).toEqual([
      'a@example.com',
      'b@example.com',
    ]);
  });

  it('does not send while the CMS switch is off', async () => {
    const { controller, sendMail } = build({
      ADMIN_NOTIFICATION_EMAIL: 'a@example.com',
    });
    expect((await controller.sendMonitorAlert(dto)).data).toEqual({
      sent: false,
      reason: 'cms-disabled',
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('answers 409 without an admin email and 502 on SMTP errors', async () => {
    await expect(
      build({
        MONITOR_ALERT_EMAIL_ENABLED: 'true',
      }).controller.sendMonitorAlert(dto),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      build(
        {
          MONITOR_ALERT_EMAIL_ENABLED: 'true',
          ADMIN_NOTIFICATION_EMAIL: 'a@example.com',
        },
        vi.fn().mockRejectedValue(new Error('auth failed')),
      ).controller.sendMonitorAlert(dto),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
