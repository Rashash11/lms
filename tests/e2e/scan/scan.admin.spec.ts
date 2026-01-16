import { test, expect } from '@playwright/test';
import { newContextAsRole } from '../../helpers/login';
import { captureArtifacts } from '../../helpers/artifacts';
import { attachApiObserver } from '../../helpers/apiAssert';
import { attachConsoleFail } from '../../helpers/consoleFail';
import { getRoleRoutes } from '../../helpers/routes';

test.describe('Full Frontend Scan - Admin', () => {
    test.setTimeout(300_000);

    test('admin core pages load and call backend cleanly', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const apiGuard = attachApiObserver(page, testInfo);
        const consoleGuard = attachConsoleFail(page, testInfo);

        const routes = getRoleRoutes('admin').filter((r) =>
            r !== '/admin/courses/new/edit' &&
            !/^\/admin\/learning-paths\/[^/]+\/edit$/.test(r)
        );

        for (const route of routes) {
            try {
                await page.goto(route);
                await page.waitForLoadState('networkidle').catch(() => undefined);
                await expect(page).not.toHaveURL(/\/login/);
                const content = await page.content();
                expect(content).not.toContain('Application error');
                expect(content).not.toContain('Something went wrong');
            } catch (e) {
                await captureArtifacts(page, testInfo, `admin-${route.replace(/\W+/g, '_')}`);
                throw new Error(`Admin scan failed at ${route}: ${String((e as any)?.message || e)}`);
            }
        }

        await apiGuard.assertClean();
        await consoleGuard.assertClean();
        await context.close();
    });
});
