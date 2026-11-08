/**
 * Keys the settings UI (`enem-landing-cms`, Story 07) reads/writes that
 * have a real env var counterpart — `getAll()` falls back to `process.env`
 * per key here, the same way `get()` does, so a key never saved through
 * the CMS (e.g. a freshly added `R2_*` var) still shows up instead of
 * blank. Ported from mau-account-api's `ENV_FALLBACK_KEYS`.
 */
export const ENV_FALLBACK_KEYS = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL_BASE',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USERNAME',
  'SMTP_PASSWORD',
  'SMTP_FROM_NAME',
  'SMTP_FROM_EMAIL',
  'ADMIN_NOTIFICATION_EMAIL',
  'IMAGE_TRANSFORMS_ENABLED',
] as const;

/**
 * Non-secret switches the public sites read through the unauthenticated
 * `GET /system-settings/public` (see `PublicSystemSettingsController`).
 * Only keys listed here ever leave the API that way - never add a
 * credential.
 */
export const PUBLIC_SETTING_KEYS = ['IMAGE_TRANSFORMS_ENABLED'] as const;

/** Shape of `GET /system-settings/public`. */
export interface PublicSystemSettings {
  /**
   * Serve cdn.muzanella.com images resized as WebP/AVIF through Cloudflare
   * Image Transformations (/cdn-cgi/image/...). Only on once the zone has
   * Transformations enabled, or those images 404.
   */
  imageTransformsEnabled: boolean;
}
