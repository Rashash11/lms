import { test, expect } from '@playwright/test';

/**
 * Strategy: "The Crawler"
 * Purpose: Visit every link in the sidebar and main navigation
 * to ensure no 500s or hydration errors occur.
 */
test.describe('Admin Route Crawler', () => {
    // Use admin auth state (defined in playwright.config.ts)
    test.use({ storageState: 'tests/e2e/storage/admin.json' });

    const routesToVisit = [
        '/admin',
        '/admin/users',
        '/admin/courses',
        '/admin/reports',
        '/admin/settings',
        '/admin/branches',
    ];

    for (const route of routesToVisit) {
        test(`crawl route: ${route}`, async ({ page }) => {
            // 1. Navigate
            const response = await page.goto(route);

            // 2. Assert no server error
            expect(response?.status()).toBe(200);

            // 3. Assert no "Application error" or common 500 patterns in UI
            const bodyText = await page.innerText('body');
            expect(bodyText).not.toContain('Internal Server Error');
            expect(bodyText).not.toContain('Something went wrong');

            // 4. Assert sidebar is visible (proves layout rendered)
            await expect(page.locator('nav')).toBeVisible();
        });
    }
});
