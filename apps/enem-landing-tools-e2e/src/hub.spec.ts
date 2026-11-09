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

  test('sitemap lastmod is the content date, not the build date', async ({
    page,
    request,
  }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const lastmod = (path: string) =>
      new RegExp(`<loc>[^<]*${path}</loc><lastmod>([^<]+)</lastmod>`).exec(
        sitemap,
      )?.[1];
    const todayWib = new Date(Date.now() + 7 * 3_600_000)
      .toISOString()
      .slice(0, 10);

    // Daily content (today's prayer times) is dated today.
    expect(lastmod('/jadwal-sholat/kota-bandung')).toBe(todayWib);
    // Other pages carry a manifest date: a real day between launch and today.
    const toolDate = lastmod('/kalkulator-gaji-bersih');
    expect(toolDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toolDate! >= '2026-11-07' && toolDate! <= todayWib).toBe(true);
    // Answer pages share their tool's date.
    expect(lastmod('/gaji-bersih/5000000')).toBe(toolDate);

    // The homepage <loc> matches its canonical exactly (trailing slash).
    await gotoReady(page, '/');
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href');
    expect(canonical).toMatch(/\/$/);
    expect(sitemap).toContain(`<loc>${canonical}</loc>`);
  });

  test('tool pages have their own Open Graph image, Twitter card, and related tools', async ({
    page,
    request,
  }) => {
    await gotoReady(page, '/simulasi-kpr');
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogImage).toMatch(/\/og\/simulasi-kpr\.png$/);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Tools muzanella',
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'id_ID',
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );

    const image = await request.get(new URL(ogImage ?? '').pathname);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');

    await expect(
      page.getByRole('heading', { name: /Cara pakai/ }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'Tools lainnya' })
        .getByRole('link')
        .first(),
    ).toBeVisible();
  });

  test('unknown pages return a noindex 404 in Indonesian', async ({ page }) => {
    const response = await page.goto('/halaman-yang-tidak-ada');
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"][content*="noindex"]'),
    ).toHaveCount(1);
  });

  test('without a publisher id: ads.txt is 404 and there is no verification tag (Story 27)', async ({
    page,
    request,
  }) => {
    // The seeded settings have no AdSense publisher id.
    expect((await request.get('/ads.txt')).status()).toBe(404);
    await gotoReady(page, '/');
    await expect(
      page.locator('meta[name="google-adsense-account"]'),
    ).toHaveCount(0);
    await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
  });
});
