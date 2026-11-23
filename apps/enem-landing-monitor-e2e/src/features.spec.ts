import { expect, test } from '@playwright/test';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginAsSuperAdmin, waitForHydration } from './helpers/auth.js';
import { E2E_WEBHOOK_KEY, PROD_API_CONTAINER } from './helpers/constants.js';

const containerLog = join(
  __dirname,
  '../fixtures/host/docker/containers',
  PROD_API_CONTAINER,
  `${PROD_API_CONTAINER}-json.log`,
);

test.describe('metrics', () => {
  test('Server opens on host metrics', async ({ page }) => {
    await loginAsSuperAdmin(page, '/server');
    const panel = page.getByTestId('metrics-panel');
    await expect(panel).toContainText('RAM');
    await expect(page.getByTestId('host-uptime')).toHaveText('2 hari 0 jam');
  });

  test('Apps shows memory against the limit, and a Memory tab', async ({
    page,
  }) => {
    await loginAsSuperAdmin(page, '/apps');
    await expect(page.getByTestId('memory-enem-landing-api')).toContainText(
      '75%',
    );
    await page.getByRole('tab', { name: 'Memory' }).click();
    await expect(page.getByTestId('memory-table')).toContainText(
      'enem-landing-api',
    );
    await expect(page.getByTestId('memory-table')).toContainText('128 MB');
  });

  test('Server has a login analysis tab', async ({ page }) => {
    await loginAsSuperAdmin(page, '/server?tab=analysis');
    await expect(page.getByTestId('security-panel')).toContainText('Top IP');
    await expect(page.getByTestId('logins')).toBeVisible();
  });
});

test.describe('DB and Redis', () => {
  test('DB shows table sizes and slow query patterns', async ({ page }) => {
    await loginAsSuperAdmin(page, '/db');
    await expect(page.getByTestId('mysql-stats')).toBeVisible();
    await page.getByRole('tab', { name: 'Ukuran' }).click();
    await expect(page.getByTestId('mysql-sizes')).toContainText(
      'e2e_big_table',
    );
    await page.getByRole('tab', { name: 'Pola slow query' }).click();
    await expect(page.getByTestId('slow-patterns')).toContainText(
      'SELECT COUNT(*) FROM e2e_slow_table',
    );
  });

  test('Cache moved from the CMS to the Redis menu', async ({ page }) => {
    await loginAsSuperAdmin(page, '/redis');
    await expect(page.getByTestId('redis-stats')).toBeVisible();
    await page.getByRole('tab', { name: 'Cache' }).click();
    await expect(page.getByTestId('cache-panel')).toBeVisible();
  });
});

test.describe('alerts', () => {
  test('the backup webhook needs its key and lands in the history', async ({
    page,
    request,
  }) => {
    const wrong = await request.post('/api/hooks/mysql-backup', {
      headers: { 'X-Webhook-Key': 'wrong-key-0123456789abcdef0123456789' },
      data: { text: 'should not be recorded' },
    });
    expect(wrong.status()).toBe(401);
    const unknown = await request.post('/api/hooks/nope', {
      headers: { 'X-Webhook-Key': E2E_WEBHOOK_KEY },
      data: { text: 'x' },
    });
    expect(unknown.status()).toBe(404);

    const marker = `e2e backup failure ${Date.now()}`;
    const ok = await request.post('/api/hooks/mysql-backup', {
      headers: { 'X-Webhook-Key': E2E_WEBHOOK_KEY },
      data: { content: marker, text: marker },
    });
    expect(ok.status()).toBe(200);

    await loginAsSuperAdmin(page, '/alerts');
    const history = page.getByTestId('alert-history');
    await expect(history).toContainText('Backup MySQL gagal');
    await expect(history).toContainText('tidak dikirim (bukan prod)');
    await page.getByRole('tab', { name: 'Aturan' }).click();
    await expect(page.getByTestId('alert-rules')).toContainText(
      'Container crash',
    );
    await expect(page.getByTestId('alert-rules')).not.toContainText('SMTP');
  });
});

test.describe('uptime and deploy', () => {
  test('Uptime lists the fixed targets', async ({ page }) => {
    await loginAsSuperAdmin(page, '/uptime');
    await expect(page.getByTestId('uptime-targets')).toContainText(
      'enem-landing-account-api',
    );
    await expect(page.getByTestId('uptime-targets')).toContainText('Redis');
  });

  test('Deploy shows the running version from OCI labels', async ({ page }) => {
    await loginAsSuperAdmin(page, '/deploy');
    const rows = page.getByTestId('deploy-rows');
    await expect(rows).toContainText('enem-landing-api');
    await expect(rows).toContainText('v9.9.9');
    await expect(rows.getByRole('link', { name: 'e2e1234' })).toHaveAttribute(
      'href',
      'https://github.com/muzanella11/enem-landing/commit/e2e1234567890abcdef1234567890abcdef12345',
    );
  });
});

test.describe('log viewer', () => {
  test('timeline shows every container around a time', async ({ page }) => {
    await loginAsSuperAdmin(
      page,
      '/timeline?around=2026-11-20T08:00:06.000Z&window=4',
    );
    const lines = page.getByTestId('timeline-lines');
    await expect(lines).toContainText('e2e stderr failure');
    await expect(lines).toContainText('enem-landing-api');
  });

  test('a deep link reopens the same container and search', async ({
    page,
  }) => {
    await loginAsSuperAdmin(
      page,
      `/apps?tab=apps-prod&container=${PROD_API_CONTAINER}&q=stderr%20failure`,
    );
    const lines = page.getByTestId('log-lines');
    await expect(lines).toContainText('e2e stderr failure');
    await expect(lines).not.toContainText('successfully started');
    await expect(
      page.getByRole('textbox', { name: 'Cari (tidak case-sensitive)' }),
    ).toHaveValue('stderr failure');
  });

  test('saved filters survive a reload', async ({ page }) => {
    await loginAsSuperAdmin(page, '/apps');
    await page
      .getByRole('textbox', { name: 'Cari (tidak case-sensitive)' })
      .fill('structured');
    await page.getByRole('button', { name: 'Cari', exact: true }).click();
    await page.getByTestId('saved-filters').click();
    await page.getByPlaceholder('Nama filter').fill('e2e structured');
    await page.getByRole('button', { name: 'Simpan', exact: true }).click();
    await page.reload();
    await waitForHydration(page);
    await page.getByTestId('saved-filters').click();
    await expect(
      page.getByRole('button', { name: 'e2e structured', exact: true }),
    ).toBeVisible();
  });

  test('live tail shows new lines', async ({ page }, testInfo) => {
    // The fixture file is shared by the browser projects: one is enough.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      testInfo.project.name !== 'chromium',
      'writes to a shared fixture',
    );
    const original = readFileSync(containerLog, 'utf8');
    try {
      await loginAsSuperAdmin(page, '/apps');
      await expect(page.getByTestId('log-lines')).toContainText(
        'successfully started',
      );
      await page.getByTestId('live-tail').click();
      await expect(page.getByTestId('live-status')).toContainText(
        'Live tail aktif',
      );
      // The tail starts at the file size it sees when the stream opens,
      // so keep appending until a line written after that shows up.
      const marker = `e2e live line ${Date.now()}`;
      await expect(async () => {
        appendFileSync(
          containerLog,
          `${JSON.stringify({ log: `${marker}\n`, stream: 'stdout', time: new Date().toISOString() })}\n`,
        );
        await expect(page.getByTestId('log-lines')).toContainText(marker, {
          timeout: 2500,
        });
      }).toPass({ timeout: 15_000 });
      await page.getByTestId('live-tail-stop').click();
    } finally {
      writeFileSync(containerLog, original);
    }
  });
});
