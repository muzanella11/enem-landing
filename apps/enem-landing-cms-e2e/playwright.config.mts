import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4000';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /*
   * Four servers: enem-landing-account-api (real signin/whoami),
   * enem-landing-api (the business-domain data these tests create/edit),
   * enem-landing-account-web (the actual signin UI the auth guard redirects
   * to), and enem-landing-cms itself. `serve` (not `serve-static`) on the
   * CMS - it has Nitro server routes (server/api/**, the BFF layer), which
   * a static file server can't run. Requires a seeded local MySQL/Redis
   * (see Story 03 - `migration:run` + `seed`) before running this suite.
   */
  // `undefined` when BASE_URL is set - see account-web-e2e's
  // playwright.config.mts header comment for why (mau-apps' "serverless"
  // pattern - CI pre-starts real servers by hand once, see e2e.yml).
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
          command: 'yarn nx run enem-landing-api:serve',
          url: 'http://localhost:3001/health',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
        },
        {
          command: 'yarn nx run enem-landing-account-web:serve',
          url: 'http://localhost:8000',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
        },
        {
          command: 'yarn nx run enem-landing-cms:serve',
          url: 'http://localhost:4000',
          reuseExistingServer: !process.env['CI'],
          cwd: workspaceRoot,
          timeout: 180_000,
        },
      ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
