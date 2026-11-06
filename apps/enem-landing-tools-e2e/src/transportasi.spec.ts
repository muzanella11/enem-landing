import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('fuel and travel (Story 50)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('BBM trip cost uses the Pertamina price and is never sent', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-bbm');
    await expect(page.getByLabel('Harga per liter')).toHaveValue('10.000');
    await page.getByLabel('Jarak (km)').fill('321');
    await page.getByLabel('Konsumsi (km per liter)').fill('10.7');
    // 321 / 10,7 = 30 L x Rp10.000
    await expect(page.locator(result)).toHaveText('Rp300.000');
    await page.getByLabel('Jenis BBM').selectOption('pertamax');
    await expect(page.locator(result)).toHaveText('Rp478.500');
    expect(traffic.containing('321')).toEqual([]);
  });

  test('speed: 300 km at 80 km/h, arrival in another zone', async ({
    page,
  }) => {
    await gotoReady(page, '/kalkulator-kecepatan');
    await page.getByLabel('Jarak', { exact: true }).fill('300');
    await page.getByLabel('Kecepatan rata-rata').fill('80');
    await page.getByLabel('Jam berangkat (opsional)').fill('22:30');
    await page.getByLabel('Zona tiba').selectOption('WITA');
    await expect(page.locator(result)).toHaveText('3 jam 45 menit');
    await expect(page.getByText('03:15 WITA')).toBeVisible();
  });

  test('ship fuel cost per ton', async ({ page }) => {
    await gotoReady(page, '/kalkulator-bbm-kapal');
    await page.getByLabel('Jarak', { exact: true }).fill('120');
    await page.getByLabel('Kecepatan (knot)').fill('12');
    await page.getByLabel('Konsumsi bahan bakar').fill('2.4');
    await page.locator('#kapal-sk').selectOption('ton');
    await page.locator('#kapal-per').selectOption({ label: 'hari' });
    await page.getByLabel('Harga bahan bakar').fill('15000000');
    await page.locator('#kapal-sh').selectOption('ton');
    await expect(page.locator(result)).toHaveText('Rp15.000.000');
    await expect(page.locator('[aria-live]')).toContainText(
      'Waktu tempuh: 10 jam',
    );
  });

  test('train travel time with stops', async ({ page }) => {
    await gotoReady(page, '/kalkulator-perjalanan-kereta');
    await page.getByLabel('Jarak (km)').fill('700');
    await page.getByLabel('Jumlah berhenti').fill('6');
    await page.getByLabel('Lama tiap berhenti (menit)').fill('5');
    await expect(page.locator(result)).toHaveText('10 jam 30 menit');
  });

  test('aircraft avtur cost with headwind', async ({ page }) => {
    await gotoReady(page, '/kalkulator-bahan-bakar-pesawat');
    await page.getByLabel('Jarak', { exact: true }).fill('1400');
    await page.getByLabel('Kecepatan jelajah').fill('800');
    await page.locator('#pes-sk').selectOption('kmh');
    await page.getByLabel(/Angin/).fill('-100');
    await page.getByLabel('Konsumsi per jam').fill('2400');
    await page.getByLabel('Harga avtur').fill('12000');
    await expect(page.locator(result)).toHaveText('Rp72.000.000');
    await expect(
      page.getByText(/Bukan untuk perencanaan penerbangan/),
    ).toBeVisible();
  });
});
