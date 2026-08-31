import { expect, test } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

test.describe('site-profile', () => {
  test('submitting the form persists across a reload', async ({ page, browserName }) => {
    // `site-profile` is a single-row singleton, not per-test data - running
    // this same test across all 3 browser projects in parallel means they
    // all race to update the one row. Cross-browser DOM/rendering coverage
    // isn't the point of this test anyway (that's login-redirect's job);
    // one browser is enough to verify the actual save/persist behavior.
    test.skip(browserName !== 'chromium', 'shared singleton row - avoid cross-browser races');

    await loginAsSuperAdmin(page, '/site-profile');

    const heroTitle = `E2E Hero ${Date.now()}`;

    // This form's fields are pre-populated from `useFetch` (unlike the
    // signin form, which starts empty), and interacting with it too soon
    // loses a real Nuxt hydration race: the server-rendered HTML already
    // has working-looking inputs and a clickable Save button before Vue
    // has attached its event listeners, so a `.fill()` + `.click()` that
    // land too early either get silently reverted (v-model never synced,
    // since its own listener wasn't attached to catch the input event
    // either) or are no-ops. Retrying the whole fill+click+confirm
    // sequence as one unit - not fill and click separately - is what
    // actually closes the race, since only a later retry iteration (once
    // hydration has definitely finished) has both a v-model that syncs
    // the typed value AND a click handler that submits it.
    await expect(async () => {
      await page.getByLabel('Hero Title').fill(heroTitle);
      await page.getByLabel('Bio').fill('Bio written by an e2e test.');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Site profile saved.')).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    await page.reload();
    await expect(page.getByLabel('Hero Title')).toHaveValue(heroTitle);
  });
});
