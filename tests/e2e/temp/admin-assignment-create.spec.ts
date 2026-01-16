import { test, expect } from '@playwright/test';
import { getStorageStatePath } from '../helpers/auth';

test.use({ storageState: getStorageStatePath('admin') });

test('Admin can create a simple assignment', async ({ page }) => {
  await page.goto('/admin/assignments/new');
  await page.getByLabel('Assignment Title').fill(`E2E_Admin_Assignment_${Date.now()}`);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page).toHaveURL(/\/admin\/assignments/);
});
