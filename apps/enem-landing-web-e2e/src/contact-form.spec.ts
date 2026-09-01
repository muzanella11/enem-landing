import { expect, test } from '@playwright/test';

test.describe('contact form', () => {
  test('submitting valid details shows a success message and clears the form', async ({ page }) => {
    await page.goto('/');

    // Same Nuxt hydration race documented in cms-e2e's site-profile.spec.ts:
    // the server-rendered form and its Send button are clickable before
    // Vue's own event listeners attach, so a fill+click landing too early
    // is a silent no-op (v-model never synced, no submit fires). Retrying
    // the whole fill+click sequence as one unit is what actually closes
    // the race - only a later retry (once hydration has finished) has a
    // click handler ready to catch it.
    await expect(async () => {
      await page.getByLabel('Full name').fill('E2E Test User');
      await page.getByLabel('Email address').fill(`e2e-${Date.now()}@example.com`);
      await page.getByLabel('Phone number').fill('081234567890');
      await page.getByLabel('Message').fill('Message sent by an e2e test.');
      await page.getByRole('button', { name: 'Send' }).click();
      await expect(page.getByText('Form submission successful!')).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    await expect(page.getByLabel('Full name')).toHaveValue('');
    await expect(page.getByLabel('Message')).toHaveValue('');
  });

  test('"Get Business Card" swaps the form for contact details', async ({ page }) => {
    await page.goto('/');

    // Same hydration race as the test above - a click landing before Vue's
    // listener attaches is a silent no-op, leaving `businessCardShown`
    // unchanged and the form still showing. Retry the click+assert as one
    // unit.
    await expect(async () => {
      await page.getByRole('button', { name: 'Get Business Card' }).click();
      await expect(page.getByRole('heading', { name: 'Nurfirliana Muzanella', level: 3 })).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 15_000 });
    // `exact: true` - the footer's Copyright.vue also mentions the email
    // inline ("... // Email: muzanella11@gmail.com // ...") and is always
    // in the DOM, so a substring match would hit both.
    await expect(page.getByText('muzanella11@gmail.com', { exact: true })).toBeVisible();

    await expect(async () => {
      await page.getByRole('button', { name: 'Send Message' }).click();
      await expect(page.getByLabel('Full name')).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  });
});
