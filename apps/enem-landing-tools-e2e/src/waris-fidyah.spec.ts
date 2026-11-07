import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('waris, fidyah, kafarat (Story 45)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('waris stays off (noindex) until reviewed', async ({ page }) => {
    await gotoReady(page, '/kalkulator-waris');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
  });

  test('fidyah 30 days at the BAZNAS 2026 rate', async ({ page }) => {
    await gotoReady(page, '/kalkulator-fidyah');
    await page.getByLabel('Jumlah hari tidak berpuasa').fill('30');
    await page.getByRole('button', { name: 'Hitung fidyah' }).click();
    await expect(page.locator(result)).toHaveText('Rp1.950.000');
  });

  test('kafarat sumpah: 10 orang miskin', async ({ page }) => {
    await gotoReady(page, '/kalkulator-kafarat');
    await expect(page.locator(result)).toHaveText('Rp650.000');
    await page.getByLabel('Jenis kafarat').selectOption('zihar');
    await expect(page.locator(result)).toHaveText('Rp3.900.000');
  });

  test('fidyah and kafarat inputs are never sent', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-fidyah');
    await page.getByLabel('Jumlah hari tidak berpuasa').fill('29');
    await page.getByLabel('Fidyah uang per hari').fill('61234');
    await page.getByRole('button', { name: 'Hitung fidyah' }).click();
    await expect(page.locator('[aria-live] .text-3xl')).toHaveText(
      'Rp1.775.786',
    );
    expect(traffic.containing('61234')).toEqual([]);
  });
});
