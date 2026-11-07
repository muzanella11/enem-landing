import { expect, test } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

/**
 * Story 25: site switcher on Activity Tracking and the tool registry CRUD.
 * Chromium only - these touch shared registry rows, same reasoning as
 * site-profile.spec.ts.
 */
test.describe('tools (Story 25)', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'shared registry rows - avoid cross-browser races',
    );
  });

  test('activity tracking switches to the tools site and hides Sessions', async ({
    page,
  }) => {
    await loginAsSuperAdmin(page, '/activity-tracking');
    // See site-profile.spec.ts: wait for hydration before interacting.
    await page.waitForTimeout(2_000);
    await expect(page.getByRole('link', { name: 'Sessions' })).toBeVisible();

    await page.getByRole('button', { name: 'tools.muzanella.com' }).click();
    await expect(page).toHaveURL(/\?site=tools/);
    await expect(page.getByRole('link', { name: 'Sessions' })).toHaveCount(0);

    // The sidebar has its own "Settings" link; target the tracking one.
    await page
      .locator('a[href="/activity-tracking/settings?site=tools"]')
      .click();
    await expect(page).toHaveURL(/settings\?site=tools/);
    await expect(
      page.getByText('Dimatikan permanen demi privasi input pengguna tools.'),
    ).toBeVisible();
  });

  test('create, edit, and delete a tool in the registry', async ({ page }) => {
    const slug = `e2e-tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await loginAsSuperAdmin(page, '/tools');
    await page.waitForTimeout(2_000);

    await page.getByRole('button', { name: 'Tambah tool' }).click();
    await page.getByLabel('Nama', { exact: true }).fill('Tool E2E');
    await page.getByLabel('Slug (route di tools app)').fill(slug);
    await page.getByLabel('Deskripsi singkat').fill('Dibuat oleh test e2e.');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Tool disimpan.')).toBeVisible();
    const row = page.locator('tr', { hasText: `/${slug}` });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'Ubah' }).click();
    await page.getByLabel('Nama', { exact: true }).fill('Tool E2E diubah');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.locator('tr', { hasText: `/${slug}` })).toContainText(
      'Tool E2E diubah',
    );

    await page
      .locator('tr', { hasText: `/${slug}` })
      .getByRole('button', { name: 'Hapus' })
      .click();
    await expect(page.getByText('Tool dihapus dari registry.')).toBeVisible();
    await expect(page.locator('tr', { hasText: `/${slug}` })).toHaveCount(0);
  });
});
