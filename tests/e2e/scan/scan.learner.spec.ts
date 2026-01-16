import { test, expect } from '@playwright/test';
import { newContextAsRole } from '../../helpers/login';
import { loadE2ESeedFixtures } from '../../helpers/seed';
import { captureArtifacts } from '../../helpers/artifacts';
import { attachApiObserver } from '../../helpers/apiAssert';
import { attachConsoleFail } from '../../helpers/consoleFail';

test.describe('Full Frontend Scan - Learner', () => {
    test.setTimeout(300_000);

    test('learner core pages and course player load', async ({ browser }, testInfo) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();
        const apiGuard = attachApiObserver(page, testInfo);
        const consoleGuard = attachConsoleFail(page, testInfo);

        const routes = [
            '/learner',
            '/learner/catalog',
            '/learner/courses',
            `/learner/courses/${seed.courseAId}`,
            `/learner/courses/${seed.courseAId}/units/${seed.unitVideoId}`,
        ];

        for (const route of routes) {
            try {
                await page.goto(route);
                await page.waitForLoadState('networkidle').catch(() => undefined);
                await expect(page.getByRole('navigation').first()).toBeVisible();
            } catch (e) {
                await captureArtifacts(page, testInfo, `learner-${route.replace(/\W+/g, '_')}`);
                throw e;
            }
        }

        await apiGuard.assertClean();
        await consoleGuard.assertClean();
        await context.close();
    });
});
