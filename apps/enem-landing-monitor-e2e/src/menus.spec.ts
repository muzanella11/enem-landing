import { expect, test } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

test.describe('monitor menus', () => {
  test('sidebar has Server, DB, Redis and Apps as top-level menus', async ({
    page,
  }) => {
    await loginAsSuperAdmin(page);
    const nav = page.locator('nav');
    for (const title of ['Dashboard', 'Server', 'DB', 'Redis', 'Apps']) {
      await expect(nav.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(nav.getByText('Logs', { exact: true })).toHaveCount(0);
  });

  test('dashboard shows overview data and a card per menu', async ({
    page,
  }) => {
    await loginAsSuperAdmin(page);
    await expect(page.getByTestId('overview-environment')).toHaveText('e2e');
    for (const card of ['server', 'apps', 'db', 'redis']) {
      await expect(page.getByTestId(`card-${card}`)).toBeVisible();
    }
    await expect(page.getByTestId('card-apps')).toContainText(
      'Container prod aktif',
    );
    await expect(page.getByTestId('card-apps')).toContainText('1');
  });

  test('Server reads auth.log with search', async ({ page }) => {
    await loginAsSuperAdmin(page, '/server');
    await expect(page.getByTestId('source-summary')).toContainText('Auth');
    await page.getByRole('tab', { name: 'Keamanan dan Akses' }).click();
    await page.getByTestId('source-auth').click();
    const lines = page.getByTestId('log-lines');
    await expect(lines).toContainText('Accepted publickey for muzanella');
    await page
      .getByRole('textbox', { name: 'Cari (tidak case-sensitive)' })
      .fill('FAILED PASSWORD');
    await page.getByRole('button', { name: 'Cari', exact: true }).click();
    await expect(lines).toContainText('Failed password for invalid user admin');
    await expect(lines).not.toContainText('Accepted publickey');
  });

  test('Apps lists the running prod container, its log and the crashed predecessor', async ({
    page,
  }) => {
    await loginAsSuperAdmin(page, '/apps');
    await expect(page.getByTestId('container-enem-landing-api')).toBeVisible();
    const lines = page.getByTestId('log-lines');
    await expect(lines).toContainText('Nest application successfully started');
    await expect(lines).toContainText('e2e stderr failure');

    await expect(
      page.getByText('Container sebelumnya', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('OOMKilled', { exact: true })).toBeVisible();
    await page.getByText('OOMKilled: melewati limit memory').click();
    await expect(lines).toContainText('JavaScript heap out of memory');

    await page.getByRole('tab', { name: 'Dev' }).click();
    await expect(
      page.getByText('Tidak ada container di stack ini.'),
    ).toBeVisible();
  });

  test('DB shows the slow query log', async ({ page }) => {
    await loginAsSuperAdmin(page, '/db');
    // Client-fetched content: the page is hydrated once it shows up, so the
    // tab click below isn't lost (WebKit clicked before hydration).
    await expect(
      page.getByText(
        'Container MySQL (stack mysql) tidak ditemukan di server.',
      ),
    ).toBeVisible();
    await page.getByRole('tab', { name: 'Slow query' }).click();
    await expect(page.getByTestId('log-lines')).toContainText(
      'SELECT COUNT(*) FROM e2e_slow_table;',
    );
  });

  test('Redis page opens with its container tab', async ({ page }) => {
    await loginAsSuperAdmin(page, '/redis');
    await expect(page.getByRole('heading', { name: 'Redis' })).toBeVisible();
    await expect(
      page.getByText(
        'Container Redis (stack redis) tidak ditemukan di server.',
      ),
    ).toBeVisible();
  });
});
