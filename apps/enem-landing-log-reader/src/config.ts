import { readFileSync } from 'node:fs';

export interface ReaderConfig {
  port: number;
  varLogDir: string;
  journalDir: string;
  containersDir: string;
  mysqlLogsDir: string;
  passwdFile: string;
  journalctlBin: string;
  tokens: string[];
}

/** Tokens shorter than this are ignored, so a weak token can't be configured. */
export const MIN_TOKEN_LENGTH = 32;

const parseTokens = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

/**
 * Every host path is mounted read-only under `/host` in the container
 * (see log-reader-stack.yml.j2). The env overrides exist for local runs and
 * e2e, which point them at fixture directories.
 *
 * Tokens come from `LOG_READER_TOKENS_FILE` (one per line, mode 0400 on the
 * host, so they don't show up in `docker service inspect`) and/or
 * `LOG_READER_TOKENS` (comma separated). Prod and dev monitor-api each have
 * their own token.
 */
export const loadConfig = (
  env: NodeJS.ProcessEnv = process.env,
): ReaderConfig => {
  const varLogDir = env['LOG_READER_VAR_LOG_DIR'] || '/host/var/log';
  let fileTokens: string[] = [];
  const tokensFile = env['LOG_READER_TOKENS_FILE'];
  if (tokensFile) {
    try {
      fileTokens = parseTokens(readFileSync(tokensFile, 'utf8'));
    } catch {
      fileTokens = [];
    }
  }

  return {
    port: Number(env['PORT'] || 3004),
    varLogDir,
    journalDir: env['LOG_READER_JOURNAL_DIR'] || `${varLogDir}/journal`,
    containersDir:
      env['LOG_READER_CONTAINERS_DIR'] || '/host/docker/containers',
    mysqlLogsDir: env['LOG_READER_MYSQL_LOGS_DIR'] || '/host/mysql-logs',
    passwdFile: env['LOG_READER_PASSWD_FILE'] || '/host/etc/passwd',
    journalctlBin: env['JOURNALCTL_BIN'] || 'journalctl',
    tokens: [...fileTokens, ...parseTokens(env['LOG_READER_TOKENS'])],
  };
};
