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
  'KEEP_ALIVE_CRON_TIME_ZONE',
] as const;
