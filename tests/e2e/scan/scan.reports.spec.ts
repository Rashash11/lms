import { test, expect } from '@playwright/test';
import { newContextAsRole } from '../../helpers/login';
import { captureArtifacts } from '../../helpers/artifacts';
import { attachApiObserver } from '../../helpers/apiAssert';
import { attachConsoleFail } from '../../helpers/consoleFail';

test.describe('Full Frontend Scan - Reports', () => {
    test.setTimeout(300_000);

    test('admin reports page loads and export endpoints stay clean', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const apiGuard = attachApiObserver(page, testInfo);
        const consoleGuard = attachConsoleFail(page, testInfo);

        try {
            await page.goto('/admin/reports');
            await page.waitForLoadState('networkidle').catch(() => undefined);
            await expect(page.getByRole('navigation').first()).toBeVisible();
        } catch (e) {
            await captureArtifacts(page, testInfo, 'admin-reports');
            throw e;
        }

        await apiGuard.assertClean();
        await consoleGuard.assertClean();
        await context.close();
    });
});
