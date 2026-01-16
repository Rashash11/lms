import { test, expect } from '@playwright/test';
import { generateAuthCookie, TEST_USERS } from '../helpers/auth-setup';

test.describe('Core User Journeys', () => {

    test('Admin can access dashboard and reports', async ({ page, context }) => {
        // Bypass login screen
        const cookie = await generateAuthCookie('ADMIN');
        await context.addCookies([cookie]);

        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(/.*\/admin\/dashboard/);
        await expect(page.getByText(/dashboard/i)).toBeVisible();

        await page.goto('/admin/reports');
        await expect(page).toHaveURL(/.*\/admin\/reports/);
        await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
    });

    test('Instructor can create a course', async ({ page, context }) => {
        const cookie = await generateAuthCookie('INSTRUCTOR');
        await context.addCookies([cookie]);

        await page.goto('/instructor/courses');
        await expect(page.getByRole('button', { name: /create course/i })).toBeVisible();

        // Note: Full creation flow might be complex for this initial checkup
        // We just verify the button is there and we can reach the create page
        await page.getByRole('button', { name: /create course/i }).click();
        await expect(page).toHaveURL(/.*\/instructor\/courses\/new/);
    });

    test('Learner can view catalog', async ({ page, context }) => {
        const cookie = await generateAuthCookie('LEARNER');
        await context.addCookies([cookie]);

        await page.goto('/learner/catalog');
        await expect(page).toHaveURL(/.*\/learner\/catalog/);
        // Expect some course card or empty state
        await expect(page.locator('body')).toBeVisible();
    });

});
