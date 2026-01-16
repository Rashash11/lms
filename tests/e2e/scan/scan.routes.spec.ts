import { test, expect } from '@playwright/test';
import type { TestRole } from '../../helpers/login';
import { extractFrontendRoutesFromFs } from '../helpers/route-list';
import { staticRoutes, getDynamicRoutes } from '../fixtures/routes';
import { captureArtifacts } from '../../helpers/artifacts';
import { attachApiObserver } from '../../helpers/apiAssert';
import { attachConsoleFail } from '../../helpers/consoleFail';
import { newContextAsRole } from '../../helpers/login';

const roles: { role: TestRole; roleGroup: string }[] = [
    { role: 'admin', roleGroup: 'admin' },
    { role: 'super-instructor', roleGroup: 'super-instructor' },
    { role: 'instructor', roleGroup: 'instructor' },
    { role: 'learner', roleGroup: 'learner' },
];

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

test.describe('Full Frontend Scan - Routes', () => {
    test.setTimeout(600_000);

    for (const { role, roleGroup } of roles) {
        test(`${role} route crawl`, async ({ browser }, testInfo) => {
            const fsRoutes = extractFrontendRoutesFromFs()
                .filter((r) => r.roleGroup === (roleGroup as any))
                .map((r) => r.path)
                .filter((p) => !p.includes('['));

            const extra = (staticRoutes as any)[roleGroup] as string[] | undefined;
            const dynamic = getDynamicRoutes();
            const dynamicForRole = (dynamic as any)[role] ? Object.values((dynamic as any)[role]) : [];
            const dynamicRoutes = normalizeNoDynamic(dynamicForRole.filter((v) => typeof v === 'string') as string[]);

            const discovered = fsRoutes;
            const prefixes = new Set(discovered.map((p) => p.split('/').slice(0, 3).join('/')));
            const dynFiltered = dynamicRoutes.filter((r) => {
                const base = r.split('/').slice(0, 3).join('/');
                return prefixes.has(base) || discovered.some((d) => r.startsWith(d));
            });
            const all = Array.from(new Set([...(extra || []), ...discovered, ...dynFiltered])).sort();
            const excludePatterns = [
                /^\/admin\/courses\/new\/edit/,
                /^\/admin\/learning-paths\/new/,
                /\/learning-paths\/[^/]+\/edit$/,
            ];
            const routesToVisit = all.filter((r) => !excludePatterns.some((re) => re.test(r)));

            for (const route of routesToVisit) {
                const page = await (await newContextAsRole(browser, role)).newPage();
                const consoleGuard = attachConsoleFail(page, testInfo);
                const apiGuard = attachApiObserver(page, testInfo);
                try {
                    let res: any = null;
                    try {
                        res = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 });
                    } catch (e: any) {
                        if (String(e?.message || e).includes('net::ERR_ABORTED')) {
                            await page.waitForLoadState('domcontentloaded').catch(() => undefined);
                        } else {
                            throw e;
                        }
                    }

                    expect(res?.status?.() || 200, `${role} ${route} status`).toBeLessThan(500);

                    await page.waitForTimeout(250);
                    const html = await page.content();
                    expect(isNotFoundContent(html), `${role} ${route} rendered 404 content`).toBe(false);
                    expect(isErrorBoundaryContent(html), `${role} ${route} rendered error boundary`).toBe(false);

                    await apiGuard.assertClean();
                    await consoleGuard.assertClean();
                } catch (e) {
                    await captureArtifacts(page, testInfo, `${role}-${route.replace(/\W+/g, '_')}`);
                    throw e;
                } finally {
                    await page.context().close().catch(() => undefined);
                }
            }
        });
    }
});
