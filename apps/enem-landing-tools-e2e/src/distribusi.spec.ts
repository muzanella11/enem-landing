import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('SEO and distribution (Story 49)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('gaji bersih answer page shows the calculator result and links to it', async ({
    page,
  }) => {
    await gotoReady(page, '/gaji-bersih/5000000');
    await expect(page.locator('[aria-live] .text-3xl')).toHaveText(
      'Rp4.800.000',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/gaji-bersih\/5000000$/,
    );
    await page
      .getByRole('link', { name: 'Hitung dengan tunjangan dan status saya' })
      .click();
    await expect(page).toHaveURL(/\/kalkulator-gaji-bersih$/);
    await expect(page.getByLabel('Gaji pokok per bulan')).toHaveValue(
      '5.000.000',
    );
  });

  test('THR answer page and unknown amount 404', async ({ page }) => {
    await gotoReady(page, '/thr/6000000');
    await expect(page.locator('[aria-live] .text-3xl')).toHaveText(
      'Rp6.000.000',
    );
    expect((await page.goto('/thr/1234'))?.status()).toBe(404);
  });

  test('OG image never depends on fragment state', async ({ page }) => {
    await page.goto('/kalkulator-gaji-bersih#s=eyJ0IjoiZ2FqaSJ9');
    const og = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(og).toMatch(/\/og\/kalkulator-gaji-bersih\.png$/);
  });

  test('widget: no ads, no tracking, noindex, framable', async ({
    page,
    request,
  }) => {
    const response = await request.get('/embed/kalkulator-zakat');
    expect(response.headers()['content-security-policy']).toContain(
      'frame-ancestors *',
    );
    const traffic = recordRequests(page);
    await page.goto('/embed/kalkulator-zakat');
    await page
      .locator('html[data-hydrated="true"]')
      .waitFor({ state: 'attached' });
    await expect(
      page.getByRole('link', { name: 'tools.muzanella.com' }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
    expect(
      traffic.requests.filter((r) =>
        /\/api\/tracking|googlesyndication|google-analytics|googletagmanager/.test(
          r.url,
        ),
      ),
    ).toEqual([]);
    // elt_consent is seeded by acceptConsent(); the widget itself must store nothing.
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter(
          (k) => k.startsWith('elt_') && k !== 'elt_consent',
        ),
      ),
    ).toEqual([]);
    expect((await page.goto('/embed/kalkulator-fiktif'))?.status()).toBe(404);
  });

  test('sitemap lists answer pages', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('/gaji-bersih/5000000');
    expect(xml).toContain('/thr/6000000');
    expect(xml).not.toContain('/embed/');
  });
});
