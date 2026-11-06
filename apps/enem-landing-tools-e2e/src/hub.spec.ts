import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady } from './helpers';

test.describe('tools hub', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('index lists the tools from the registry', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Kalkulator Gaji Bersih/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Simulasi KPR/ }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Gabung PDF/ })).toBeVisible();
  });

  test('tool pages have canonical, JSON-LD, and appear in the sitemap', async ({
    page,
    request,
  }) => {
    await gotoReady(page, '/kalkulator-gaji-bersih');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/kalkulator-gaji-bersih$/,
    );
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.some((text) => text.includes('"WebApplication"'))).toBe(true);
    expect(jsonLd.some((text) => text.includes('"FAQPage"'))).toBe(true);

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/kalkulator-gaji-bersih</loc>');
    expect(sitemap).toContain('/buat-invoice</loc>');
  });
});
