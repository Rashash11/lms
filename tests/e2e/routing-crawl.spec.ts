import { test, expect } from './e2eTest';
import { extractFrontendRoutesFromFs } from './helpers/route-list';
import { newContextAsRole, type TestRole } from '../helpers/login';
import { staticRoutes } from './fixtures/routes';
import { getDynamicRoutes } from './fixtures/routes';

const roles: TestRole[] = ['admin', 'super-instructor', 'instructor', 'learner'];

function isNotFoundContent(html: string) {
    const h = html.toLowerCase();
    return h.includes('not found') && h.includes('404');
}

function isErrorBoundaryContent(html: string) {
    const h = html.toLowerCase();
    return h.includes('something went wrong') || h.includes('application error');
}

function normalizeNoDynamic(routes: string[]) {
    return routes.filter((p) => !p.includes('['));
}

function bestNavMatch(route: string, candidates: string[]) {
    const sorted = [...candidates].sort((a, b) => b.length - a.length);
    for (const c of sorted) {
        if (route === c) return c;
        if (route.startsWith(c + '/')) return c;
    }
    return undefined;
}

function shouldHaveDrawer(role: TestRole, route: string) {
    if (role === 'admin') {
        if (route.startsWith('/admin/courses/new/edit')) return false;
        if (route.startsWith('/admin/learning-paths/new')) return false;
        if (route.includes('/learning-paths/') && route.endsWith('/edit')) return false;
    }
    return true;
}

test.describe('Routing Crawl', () => {
    test.setTimeout(300_000);

    for (const role of roles) {
        test(`${role} can load all role routes without 404/500`, async ({ browser }) => {
            const routes = extractFrontendRoutesFromFs()
                .filter((r) => r.roleGroup === role)
                .map((r) => r.path)
                .filter((p) => !p.includes('['));

            const extra = (staticRoutes as any)[role] as string[] | undefined;
            const dynamic = getDynamicRoutes();
            const dynamicForRole = (dynamic as any)[role] ? Object.values((dynamic as any)[role]) : [];
            const dynamicRoutes = normalizeNoDynamic(dynamicForRole.filter((v) => typeof v === 'string') as string[]);

            const all = Array.from(new Set([...(extra || []), ...routes, ...dynamicRoutes])).sort();

            const context = await newContextAsRole(browser, role);
            const page = await context.newPage();
            const drawer = page.locator('.MuiDrawer-root:not([hidden])').first();

            for (const route of all) {
                const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
                expect(res?.status() || 200, `${role} ${route} status`).toBeLessThan(500);

                await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
                const html = await page.content();
                expect(isNotFoundContent(html), `${role} ${route} rendered 404 content`).toBe(false);
                expect(isErrorBoundaryContent(html), `${role} ${route} rendered error boundary`).toBe(false);

                const drawerVisible = shouldHaveDrawer(role, route)
                    ? await drawer.isVisible().catch(() => false)
                    : false;

                const navCandidates = (staticRoutes as any)[role] as string[] | undefined;
                const nav = navCandidates ? bestNavMatch(route, navCandidates) : undefined;
                if (nav && drawerVisible) {
                    const selected = drawer.locator(`a[href="${nav}"].Mui-selected`).first();
                    await expect(selected, `${role} ${route} active nav`).toBeVisible();
                }
            }

            await context.close();
        });
    }

    test('admin reports flyout can be opened from sidebar', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin');
        await page.waitForLoadState('networkidle').catch(() => undefined);

        const drawer = page.locator('.MuiDrawer-root:not([hidden])').first();
        const reportsLink = drawer.getByRole('link', { name: 'Reports' }).first();
        await expect(reportsLink).toBeVisible();
        await reportsLink.hover();

        await expect(page.locator('[role="menu"]').first(), 'reports flyout').toBeVisible();
        await context.close();
    });
});
