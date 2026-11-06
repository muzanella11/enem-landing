import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:8002';

/**
 * See https://playwright.dev/docs/test-configuration and the header of
 * enem-landing-web-e2e/playwright.config.mts for the .mts reasoning.
 *
 * Two servers: enem-landing-api (tool registry + tracking behind this
 * app's BFF) and enem-landing-tools itself. `serve`, not `serve-static`:
 * the app has Nitro server routes. `undefined` when BASE_URL is set - CI
 * pre-starts real servers once (see e2e.yml), mau-apps' "serverless"
 * pattern.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
    acceptDownloads: true,
  },
  webServer: process.env['BASE_URL']
    ? undefined
    : [
        {
          command: 'yarn nx run enem-landing-api:serve',
          url: 'http://localhost:3001/health',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
        },
        {
          command: 'yarn nx run enem-landing-tools:serve',
          url: 'http://localhost:8002',
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
