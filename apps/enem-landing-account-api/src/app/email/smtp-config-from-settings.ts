import { SmtpConfig } from './smtp-config.js';

/** Builds a typed `SmtpConfig` from the generic key/value `system_settings` rows (`SystemSettingsService.getAll()`), same source the CMS Settings page reads/writes. */
export const smtpConfigFromSettings = (
  settings: Record<string, string>,
): SmtpConfig => ({
  host: settings['SMTP_HOST'] || '',
  port: parseInt(settings['SMTP_PORT'] || '587', 10),
  secure: settings['SMTP_SECURE'] === 'true',
  username: settings['SMTP_USERNAME'] || undefined,
  password: settings['SMTP_PASSWORD'] || undefined,
  fromName: settings['SMTP_FROM_NAME'] || 'enem-landing',
  fromEmail: settings['SMTP_FROM_EMAIL'] || settings['SMTP_USERNAME'] || '',
});

export const adminNotificationEmailsFromSettings = (
  settings: Record<string, string>,
): string[] =>
  (settings['ADMIN_NOTIFICATION_EMAIL'] || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
