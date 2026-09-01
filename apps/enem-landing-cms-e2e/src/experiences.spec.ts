import { expect, test } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

const COMPANY = `E2E Test Co ${Date.now()}`;
const COMPANY_UPDATED = `${COMPANY} (Updated)`;

test.describe('experiences', () => {
  test('create, edit, add a project, and delete an experience', async ({ page }) => {
    await loginAsSuperAdmin(page, '/experiences');

    // Create
    await page.getByRole('button', { name: 'Add Experience' }).click();
    await page.getByLabel('Company').fill(COMPANY);
    await page.getByLabel('Position').fill('QA Engineer');
    await page.getByLabel('Location').fill('Remote');
    await page.getByLabel('Period (e.g. Nov 2021 - Now)').fill('2024 - Now');
    await page.getByLabel('Role Summary').fill('Playwright coverage');
    await page.getByLabel('Description').fill('Created by an e2e test');
    await page.getByRole('button', { name: 'Save' }).click();

    // Saving navigates into the detail page for the new experience.
    await page.waitForURL(/\/experiences\/[\w-]+$/);
    await expect(page.getByRole('heading', { name: COMPANY })).toBeVisible();

    // Edit
    await page.getByLabel('Company').fill(COMPANY_UPDATED);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: COMPANY_UPDATED })).toBeVisible();

    // Add a project. Vuetify teleports dialog content to the end of the
    // DOM, so `.last()` reliably picks the dialog's fields over the
    // experience details card's own Description field and Save button
    // (there's no role="dialog" to scope by - Vuetify doesn't set one).
    await page.getByRole('button', { name: 'Add Project' }).click();
    await page.getByLabel('Title').fill('E2E Project');
    await page.getByLabel('Year').fill('2024');
    await page.getByLabel('Description').last().fill('Project created by an e2e test');
    await page.getByRole('button', { name: 'Save' }).last().click();
    await expect(page.getByText('E2E Project')).toBeVisible();

    // Cleanup: back to the list, delete the row.
    await page.getByRole('link', { name: 'Experiences' }).click();
    await page.waitForURL(/\/experiences$/);
    // Plain string, not a RegExp: COMPANY_UPDATED contains literal parens
    // ("(Updated)") which `new RegExp()` would parse as a capture group.
    const row = page.getByRole('row', { name: COMPANY_UPDATED });
    await row.getByRole('button').last().click();
    await expect(page.getByText(COMPANY_UPDATED)).toBeHidden();
  });
});
