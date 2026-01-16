import { test, expect, type Page } from '@playwright/test';
import { getStorageStatePath } from '../helpers/auth';
import { getRoleRoutes } from '../../helpers/routes';

async function assertNoErrorBoundary(page: Page) {
    await expect(page).not.toHaveURL(/\/login/);
    const content = await page.content();
    expect(content).not.toContain('Application error');
    expect(content).not.toContain('Something went wrong');
}

const ctaByRoute: Record<string, (page: Page) => Promise<void>> = {
    '/admin/users': async (page) => {
        await page.getByRole('button', { name: /add user/i }).click();
        await page.getByRole('menuitem', { name: /add user manually/i }).click();
        await expect(page).toHaveURL(/\/admin\/users\/new$/);
    },
    '/admin/courses': async (page) => {
        await page.getByTestId('admin-cta-add-course').click();
        await page.getByTestId('menuitem-create-course').click();
        await expect(page).toHaveURL(/\/admin\/courses\/new\/edit\?id=/);
    },
    '/admin/groups': async (page) => {
        await page.getByTestId('admin-cta-create-group').click();
        await expect(page).toHaveURL(/\/admin\/groups\/new$/);
    },
    '/admin/learning-paths': async (page) => {
        await page.getByTestId('admin-cta-add-learning-path').click();
        await expect(page).toHaveURL(/\/admin\/learning-paths\/new$/);
    },
    '/admin/branches': async (page) => {
        await page.getByRole('link', { name: /add branch/i }).click();
        await expect(page).toHaveURL(/\/admin\/branches\/create$/);
    },
    '/admin/notifications': async (page) => {
        await page.getByRole('button', { name: /add notification/i }).click();
        await expect(page.getByRole('heading', { name: /add notification/i })).toBeVisible();
    },
    '/admin/automations': async (page) => {
        await page.getByRole('button', { name: /create automation/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
    },
};

test.describe('Admin CTA Smoke', () => {
    test.use({ storageState: getStorageStatePath('admin') });
    test.setTimeout(180_000);

    test('all admin pages load', async ({ page }) => {
        const routes = getRoleRoutes('admin')
            .filter((r) => r.startsWith('/admin'))
            .filter((r) => r !== '/admin/courses/new/edit')
            .filter((r) => !/^\/admin\/learning-paths\/[^/]+\/edit$/.test(r));

        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForLoadState('networkidle').catch(() => undefined);
            await assertNoErrorBoundary(page);
        }
    });

    test('core admin CTAs are clickable', async ({ page }) => {
        for (const [route, action] of Object.entries(ctaByRoute)) {
            await page.goto(route);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForLoadState('networkidle').catch(() => undefined);
            await assertNoErrorBoundary(page);

            await action(page);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForLoadState('networkidle').catch(() => undefined);
            await assertNoErrorBoundary(page);
        }
    });
});
