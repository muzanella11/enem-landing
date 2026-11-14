import { expect, test } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

const API = 'http://localhost:3001';
const STAMP = Date.now();
const CLEAN_NAME = `E2E Clean ${STAMP}`;
const SPAM_NAME = `E2E Spammer ${STAMP}`;

test.describe('contact submissions', () => {
  test('flagged spam is kept apart, can be reviewed, and moved back', async ({
    page,
    request,
  }) => {
    // Posted straight to enem-landing-api (the e2e env turns the slider
    // captcha off). The spam check runs right after the submission is
    // stored, so poll the list until the flag lands.
    const submit = (fullname: string, message: string) =>
      request.post(`${API}/contact-submissions`, {
        data: {
          fullname,
          email: `e2e-${STAMP}-${fullname.length}@example.com`,
          phoneNumber: '081234567890',
          message,
          client: { timezone: 'Asia/Jakarta', fillDurationMs: 30_000 },
        },
      });
    expect(
      (
        await submit(
          CLEAN_NAME,
          'Halo, saya ingin diskusi soal proyek website.',
        )
      ).ok(),
    ).toBe(true);
    expect(
      (
        await submit(
          SPAM_NAME,
          "We drive targeted traffic within 24 hours. Is this something you'd like to explore?",
        )
      ).ok(),
    ).toBe(true);

    await loginAsSuperAdmin(page, '/contact-submissions');
    // The helper's URL check also matches the sign-in page's `?r=` param,
    // so wait for the CMS page itself before reloading.
    await expect(
      page.getByRole('heading', { name: 'Contact Submissions' }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Inbox shows the clean message only.
    await expect(async () => {
      await page.reload();
      await expect(page.getByText(CLEAN_NAME)).toBeVisible({ timeout: 2_000 });
      await expect(page.getByText(SPAM_NAME)).toBeHidden();
    }).toPass({ timeout: 20_000 });

    // The spam tab shows the flagged one with its reason. Retried as one
    // unit: a click landing before hydration is a silent no-op.
    const spamRow = page.getByRole('row').filter({ hasText: SPAM_NAME });
    await expect(async () => {
      await page.getByRole('button', { name: 'Spam', exact: true }).click();
      await expect(spamRow).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(spamRow.getByText(/phrases:targeted traffic/)).toBeVisible();

    // Details show the sender record.
    await spamRow.getByRole('button', { name: 'Details' }).click();
    await expect(page.getByText('Flagged as spam:')).toBeVisible();
    await expect(page.getByText('Network')).toBeVisible();
    await expect(page.getByText('Asia/Jakarta')).toBeVisible();

    // Moving it back to the inbox.
    await page.getByRole('button', { name: 'Not spam' }).last().click();
    await expect(
      page.getByText('Moved to inbox. No email was sent.'),
    ).toBeVisible();
  });
});
