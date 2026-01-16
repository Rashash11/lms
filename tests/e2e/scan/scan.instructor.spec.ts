import { test, expect } from '@playwright/test';
import { newContextAsRole } from '../../helpers/login';
import { loadE2ESeedFixtures } from '../../helpers/seed';
import { captureArtifacts } from '../../helpers/artifacts';
import { attachApiObserver } from '../../helpers/apiAssert';
import { attachConsoleFail } from '../../helpers/consoleFail';

test.describe('Full Frontend Scan - Instructor', () => {
    test.setTimeout(300_000);

    test('instructor core pages and seeded detail load', async ({ browser }, testInfo) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'instructor');
        const page = await context.newPage();
        const apiGuard = attachApiObserver(page, testInfo);
        const consoleGuard = attachConsoleFail(page, testInfo);

        const routes = [
            '/instructor',
            '/instructor/courses',
            `/instructor/courses/${seed.courseAId}`,
            '/instructor/groups',
            '/instructor/conferences',
        ];

        for (const route of routes) {
            try {
                await page.goto(route);
                await page.waitForLoadState('networkidle').catch(() => undefined);
                await expect(page.getByRole('navigation').first()).toBeVisible();
            } catch (e) {
                await captureArtifacts(page, testInfo, `instructor-${route.replace(/\W+/g, '_')}`);
                throw e;
            }
        }

        await apiGuard.assertClean();
        await consoleGuard.assertClean();
        await context.close();
    });
});
