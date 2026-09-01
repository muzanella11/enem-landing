import { expect, test } from '@playwright/test';

test.describe('contact form', () => {
  test('submitting valid details shows a success message and clears the form', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Full name').fill('E2E Test User');
    await page.getByLabel('Email address').fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel('Phone number').fill('081234567890');
    await page.getByLabel('Message').fill('Message sent by an e2e test.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('Form submission successful!')).toBeVisible();
    await expect(page.getByLabel('Full name')).toHaveValue('');
    await expect(page.getByLabel('Message')).toHaveValue('');
  });

  test('"Get Business Card" swaps the form for contact details', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Get Business Card' }).click();
    await expect(page.getByRole('heading', { name: 'Nurfirliana Muzanella', level: 3 })).toBeVisible();
    // `exact: true` - the footer's Copyright.vue also mentions the email
    // inline ("... // Email: muzanella11@gmail.com // ...") and is always
    // in the DOM, so a substring match would hit both.
    await expect(page.getByText('muzanella11@gmail.com', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Send Message' }).click();
    await expect(page.getByLabel('Full name')).toBeVisible();
  });
});
