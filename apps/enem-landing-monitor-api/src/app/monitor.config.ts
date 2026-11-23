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
