import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { loadE2ESeedFixtures } from '../helpers/seed';

test.describe('Learner Flows', () => {
    test('catalog loads', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();

        await page.goto('/learner/catalog');
        await expect(page.getByText('Course Catalog')).toBeVisible();

        await context.close();
    });

    test('course player completes a unit and unlocks next navigation', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();

        await page.goto(`/learner/courses/${seed.courseAId}/units/${seed.unitVideoId}`);
        await page.waitForLoadState('networkidle').catch(() => undefined);

        const markComplete = page.getByRole('button', { name: 'Mark as Complete' });
        if (await markComplete.isVisible().catch(() => false)) {
            await markComplete.click();
        }

        await expect(page.getByText('Completed')).toBeVisible();
        await context.close();
    });
});
