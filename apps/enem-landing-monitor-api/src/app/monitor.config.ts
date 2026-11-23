declare const __MONITOR_API_VERSION__: string | undefined;

/** Set by webpack's DefinePlugin from the workspace package.json. */
export const monitorApiVersion = (): string =>
  typeof __MONITOR_API_VERSION__ === 'string' ? __MONITOR_API_VERSION__ : 'dev';

export const monitorEnvironment = (): string =>
  process.env['MONITOR_ENV'] || 'local';

export const logReaderHost = (): string =>
  process.env['LOG_READER_HOST'] || 'http://localhost:3004';

export const logReaderToken = (): string =>
  process.env['LOG_READER_TOKEN'] || '';

/** Logs are off when disabled explicitly or when no token is configured. */
export const logsEnabled = (): boolean =>
  process.env['LOGS_ENABLED'] !== 'false' && logReaderToken().length >= 32;

/**
 * Only prod sends alert emails (`ALERTS_EMAIL_ENABLED=true`). Dev, local
 * and e2e still evaluate every rule and keep the history.
 */
export const alertsEmailEnabled = (): boolean =>
  process.env['ALERTS_EMAIL_ENABLED'] === 'true';

/**
 * The environment that samples host-level data shared by both monitors
 * (metrics, deploy history, TLS): prod (`MONITOR_PRIMARY=true`).
 */
export const monitorPrimary = (): boolean =>
  process.env['MONITOR_PRIMARY'] === 'true';

/** The per-minute jobs (alerts, metrics, uptime). Off in unit tests. */
export const schedulerEnabled = (): boolean =>
  process.env['SCHEDULER_ENABLED'] !== 'false';

export const accountApiHost = (): string =>
  process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000';

/** enem-landing-api of this environment (cache endpoints, health). */
export const apiHost = (): string =>
  process.env['API_HOST'] || 'http://localhost:3001';

export const internalApiKey = (): string =>
  process.env['INTERNAL_API_KEY'] || '';

/** Base URL for links in alert emails. */
export const monitorPublicUrl = (): string =>
  (process.env['MONITOR_PUBLIC_URL'] || 'http://localhost:4003').replace(
    /\/$/,
    '',
  );

/** `DATABASE_URL_MONITOR`: the `enem_monitor` MySQL user (PROCESS only). */
export const databaseUrlMonitor = (): string =>
  process.env['DATABASE_URL_MONITOR'] || '';

/**
 * `ALERT_WEBHOOKS`: `id:key` pairs, comma separated (e.g.
 * `mysql-backup:<64 hex>`). Keys shorter than 32 characters are ignored.
 */
export const alertWebhooks = (): Map<string, string> => {
  const hooks = new Map<string, string>();
  for (const pair of (process.env['ALERT_WEBHOOKS'] || '').split(',')) {
    const [id, key] = pair.trim().split(':');
    if (id && key && /^[a-z0-9-]{1,40}$/.test(id) && key.length >= 32)
      hooks.set(id, key);
  }
  return hooks;
};
