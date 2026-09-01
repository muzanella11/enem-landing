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
    // has attached its event listeners.
    //
    // A previous version of this test retried fill+click as a unit,
    // asserting only that "Site profile saved." appeared - not sufficient
    // proof either field's fill actually landed, and not fixable by also
    // asserting each field's DOM value after fill(): `.fill()` sets the
    // native `<input>`'s value directly and dispatches a raw DOM `input`
    // event, which shows up correctly under `toHaveValue` regardless of
    // whether Vuetify's `VTextField` wrapper was listening yet - it
    // manages its own `v-model` sync through its own internal handlers,
    // not by relying on the native event alone. So the DOM can show the
    // typed text while Vue's own `form.value.heroTitle` stays whatever it
    // was before, and Save silently persists that stale value. Reproduced
    // directly: 5 consecutive runs, each with a "saved" toast and a
    // `toHaveValue`-passing DOM read right after fill(), and the DB's
    // `heroTitle` never moved off its initial value - `bio` (a plain
    // `v-textarea`, later in the DOM, hydrates first this app has had
    // more time to attach handlers by the time this test reaches it)
    // updated correctly every time, isolating the race to Hero Title
    // specifically. A flat wait for hydration to fully settle before any
    // interaction (confirmed empirically: 2s is reliably enough here)
    // is the only version of this that's actually verified working.
    await page.waitForTimeout(2_000);

    await page.getByLabel('Hero Title').fill(heroTitle);
    await page.getByLabel('Bio').fill('Bio written by an e2e test.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Site profile saved.')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Hero Title')).toHaveValue(heroTitle, { timeout: 15_000 });
  });
});
