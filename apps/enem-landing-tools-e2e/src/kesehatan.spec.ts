import { expect, test, type Page } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

/** Consent and the anonymous visitor id may be stored; health input never is. */
const storedKeys = (page: Page) =>
  page.evaluate(() =>
    Object.keys(localStorage).filter(
      (key) => !/consent/i.test(key) && key !== 'elt_visitor_id',
    ),
  );

test.describe('health tools (Story 34)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('BMI shows both category tables and the disclaimer first', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-bmi');
    await page.getByLabel('Berat badan (kg)').fill('70');
    await page.getByLabel('Tinggi badan (cm)').fill('175');
    await page.getByRole('button', { name: 'Hitung BMI' }).click();
    const result = page.locator('section[aria-live]');
    await expect(result.locator('.text-3xl')).toHaveText('22,9');
    await expect(result).toContainText('Kemenkes: Normal');
    await expect(result).toContainText('WHO Asia-Pasifik: Normal');
    await expect(page.getByRole('note')).toContainText('bukan diagnosis');
    expect(traffic.containing('175')).toEqual([]);
    expect(await storedKeys(page)).toEqual([]);
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(ld.some((text) => text.includes('MedicalWebPage'))).toBe(true);
  });

  test('HPL with a 35-day cycle', async ({ page }) => {
    await gotoReady(page, '/hitung-hpl');
    await page
      .getByLabel('Hari pertama haid terakhir (HPHT)')
      .fill('2026-01-01');
    await page.getByLabel('Panjang siklus haid (hari)').fill('35');
    await page.getByRole('button', { name: 'Hitung HPL' }).click();
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      'Kamis, 15 Oktober 2026',
    );
    expect(await storedKeys(page)).toEqual([]);
  });

  test('masa subur lists three cycles and warns about contraception', async ({
    page,
  }) => {
    await gotoReady(page, '/kalkulator-masa-subur');
    await page
      .getByLabel('Hari pertama haid terakhir (HPHT)')
      .fill('2026-11-01');
    await page.getByRole('button', { name: 'Hitung masa subur' }).click();
    await expect(page.locator('section[aria-live] tbody tr')).toHaveCount(3);
    await expect(page.getByText('10 November - 16 November')).toBeVisible();
    await expect(page.getByRole('note')).toContainText('pencegahan kehamilan');
  });

  test('kalori', async ({ page }) => {
    await gotoReady(page, '/kalkulator-kalori');
    await page.getByLabel('Usia (tahun)').fill('30');
    await page.getByLabel('Berat badan (kg)').fill('60');
    await page.getByLabel('Tinggi badan (cm)').fill('160');
    await page.getByLabel('Aktivitas').selectOption('sedenter');
    await page.getByRole('button', { name: 'Hitung kalori' }).click();
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      '1.547 kkal/hari',
    );
  });
});
