import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';

test.describe('Reports', () => {
    test('admin reports page loads', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/reports');
        await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();

        await context.close();
    });

    test('training progress export downloads an xlsx', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/reports');
        await page.waitForLoadState('networkidle').catch(() => undefined);

        const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
        await page.getByRole('button', { name: /training progress/i }).click();
        await page.getByRole('menuitem', { name: /download excel/i }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename().toLowerCase()).toContain('.xlsx');
        await context.close();
    });
});
