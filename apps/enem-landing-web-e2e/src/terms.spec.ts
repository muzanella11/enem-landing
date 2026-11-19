import { expect, test } from '@playwright/test';

test.describe('terms page', () => {
  test('is linked from the footer next to about and contact', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: 'About', exact: true }).last(),
    ).toHaveAttribute('href', '/#about');
    await expect(
      page.getByRole('link', { name: 'Contact', exact: true }).last(),
    ).toHaveAttribute('href', '/#contact');
    await page.getByRole('link', { name: 'Terms of use' }).click();
    await page.waitForURL(/\/terms$/);

    await expect(
      page.getByRole('heading', { name: 'Terms of use', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Information, not professional advice',
        level: 2,
      }),
    ).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://muzanella.com/terms',
    );
  });
});
