import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { forbiddenRoutes } from './fixtures/routes';
import { loadE2ESeedFixtures } from '../helpers/seed';
import { getRoleStorageStatePath } from '../helpers/login';
import { request as requestFactory } from '@playwright/test';

function isDeniedUi(html: string) {
    const h = html.toLowerCase();
    return h.includes('access denied') || h.includes('not authorized') || h.includes('/403') || (h.includes('403') && h.includes('forbidden'));
}

test.describe('RBAC + Tenant/Node Isolation', () => {
    test('learner navigation does not expose admin links', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();

        await page.goto('/learner');
        await page.waitForLoadState('networkidle').catch(() => undefined);

        const links = await page.locator('.MuiDrawer-root a[href^="/"]').evaluateAll((els) =>
            els.map((e) => (e as HTMLAnchorElement).getAttribute('href')).filter(Boolean)
        );

        for (const forbidden of forbiddenRoutes.learner) {
            expect(links.some((h) => h === forbidden || h?.startsWith(forbidden + '/')), `nav contains ${forbidden}`).toBe(false);
        }

        await context.close();
    });

    test('learner cannot open admin routes directly', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();

        for (const route of forbiddenRoutes.learner) {
            await page.goto(route);
            await page.waitForLoadState('networkidle').catch(() => undefined);
            const html = await page.content();
            expect(isDeniedUi(html) || page.url().includes('/login') || page.url().includes('/learner'), `denied ${route}`).toBe(true);
        }

        await context.close();
    });

    test('node isolation blocks cross-node course access', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();

        const learnerA = await newContextAsRole(browser, 'learner');
        const pageA = await learnerA.newPage();
        await pageA.goto('/learner/courses');
        await pageA.waitForLoadState('networkidle').catch(() => undefined);
        await expect(pageA.getByText('Test Course B')).toHaveCount(0);
        await learnerA.close();

        const learnerApi = await requestFactory.newContext({
            baseURL: process.env.BASE_URL || 'http://localhost:3000',
            storageState: getRoleStorageStatePath('learner'),
        });
        const crossRes = await learnerApi.get(`/api/courses/${seed.courseBId}`);
        expect([403, 404]).toContain(crossRes.status());
        await learnerApi.dispose();

        const learnerB = await newContextAsRole(browser, 'learner-b');
        const pageB = await learnerB.newPage();
        await pageB.goto(`/learner/courses/${seed.courseBId}`);
        await pageB.waitForLoadState('networkidle').catch(() => undefined);
        await expect(pageB).toHaveURL(new RegExp(`/learner/courses/${seed.courseBId}/units/`));
        await expect(pageB.getByRole('heading', { name: 'Test Course B' }).first()).toBeVisible();
        await learnerB.close();
    });

    test('tenant isolation blocks tenant A IDs from tenant B admin', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'admin-b');
        const page = await context.newPage();

        await page.goto(`/admin/courses`);
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await expect(page.getByText('Test Course A')).toHaveCount(0);
        await expect(page.getByText('Test Course B')).toHaveCount(0);

        const api = await requestFactory.newContext({
            baseURL: process.env.BASE_URL || 'http://localhost:3000',
            storageState: getRoleStorageStatePath('admin-b'),
        });
        const res = await api.get(`/api/courses/${seed.courseAId}`);
        expect([403, 404]).toContain(res.status());
        await api.dispose();

        await context.close();
    });
});
