import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const { version } = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf-8'));

test('sets data-version on html tag from package.json version', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-version', version);
});
