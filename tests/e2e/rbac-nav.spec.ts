import { test, expect } from '@playwright/test';

test.describe('RBAC Navigation Visibility', () => {
    test.describe('Learner', () => {
        test.use({ storageState: 'tests/e2e/storage/learner.json' });

        test('should NOT see Admin menu items', async ({ page }) => {
            await page.goto('/learner');

            // 2. Sidebar should NOT contain "Admin" or "Settings"
            const sidebar = page.locator('nav');
            await expect(sidebar).not.toContainText('Admin');
            await expect(sidebar).not.toContainText('Users');
            await expect(sidebar).not.toContainText('Settings');
        });
    });

    test.describe('Admin', () => {
        test.use({ storageState: 'tests/e2e/storage/admin.json' });

        test('SHOULD see all menu items', async ({ page }) => {
            await page.goto('/admin');

            const sidebar = page.locator('nav');
            await expect(sidebar).toContainText('Home');
            await expect(sidebar).toContainText('Users');
            await expect(sidebar).toContainText('Settings');
            await expect(sidebar).toContainText('Audit Log');
        });
    });
});
