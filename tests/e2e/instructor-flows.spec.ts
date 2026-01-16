import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { loadE2ESeedFixtures } from '../helpers/seed';

test.describe('Instructor Flows', () => {
    test('courses list loads', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'instructor');
        const page = await context.newPage();

        await page.goto('/instructor/courses');
        await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();

        await context.close();
    });

    test('seeded course detail loads', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'instructor');
        const page = await context.newPage();

        await page.goto(`/instructor/courses/${seed.courseAId}`);
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await expect(page.getByText('Test Course A')).toBeVisible();

        await context.close();
    });
});
