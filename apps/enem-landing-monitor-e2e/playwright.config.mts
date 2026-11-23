import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { join } from 'node:path';

/**
 * Fixture "host" for the log-reader. e2e.yml starts the same servers by
 * hand with the same values in CI. Test-only token, never used elsewhere.
 */
const E2E_LOG_READER_TOKEN = 'e2e-log-reader-token-0123456789abcdef';

const fixtures = join(import.meta.dirname, 'fixtures/host');

const LOG_READER_ENV = {
  PORT: '3004',
  LOG_READER_TOKENS: E2E_LOG_READER_TOKEN,
  LOG_READER_VAR_LOG_DIR: join(fixtures, 'var/log'),
  LOG_READER_CONTAINERS_DIR: join(fixtures, 'docker/containers'),
  LOG_READER_MYSQL_LOGS_DIR: join(fixtures, 'mysql-logs'),
  LOG_READER_PASSWD_FILE: join(fixtures, 'etc/passwd'),
  LOG_READER_PROC_DIR: join(fixtures, 'proc'),
  LOG_READER_CGROUP_DIR: join(fixtures, 'cgroup'),
  LOG_READER_MYSQL_DATA_DIR: join(fixtures, 'mysql-data'),
};

/** Test-only webhook key, same value in e2e.yml and src/helpers/constants.ts. */
const E2E_WEBHOOK_KEY = 'e2e-webhook-key-0123456789abcdef0123456789';

const MONITOR_API_ENV = {
  PORT: '3003',
  MONITOR_ENV: 'e2e',
  LOG_READER_HOST: 'http://localhost:3004',
  LOG_READER_TOKEN: E2E_LOG_READER_TOKEN,
  LOGS_ENABLED: 'true',
  REDIS_KEY_PREFIX: 'e2e:monitor',
  ALERT_WEBHOOKS: `mysql-backup:${E2E_WEBHOOK_KEY}`,
};

// For CI, BASE_URL is set and e2e.yml starts every server by hand.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4003';

/**
 * Five servers: enem-landing-account-api (real signin/whoami),
 * enem-landing-account-web (signin UI), enem-landing-log-reader (pointed at
 * the fixture "host" under ./fixtures/host), enem-landing-monitor-api and
 * enem-landing-monitor itself. Requires a seeded local MySQL/Redis.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env['BASE_URL']
    ? undefined
    : [
        {
          command: 'yarn nx run enem-landing-account-api:serve',
          url: 'http://localhost:3000/health',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
        },
        {
          command: 'yarn nx run enem-landing-log-reader:serve',
          url: 'http://localhost:3004/health',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
          env: LOG_READER_ENV,
        },
        {
          command: 'yarn nx run enem-landing-monitor-api:serve',
          url: 'http://localhost:3003/health',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
          env: MONITOR_API_ENV,
        },
        {
          command: 'yarn nx run enem-landing-account-web:serve',
          url: 'http://localhost:8000',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
        },
        {
          command: 'yarn nx run enem-landing-monitor:serve',
          url: 'http://localhost:4003',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
        },
      ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
