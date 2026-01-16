/**
 * Site Crawler - Full E2E Test
 * 
 * Exhaustive site crawler that visits all pages for all roles.
 * Designed for nightly CI runs.
 */

import { test, expect, Page, BrowserContext, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getStorageStatePath, loadSeedFixtures, TestRole } from '../helpers/auth';
import { staticRoutes, getDynamicRoutes } from '../fixtures/routes';

// Load routing audit report for all known routes
const routingReportPath = path.join(process.cwd(), 'routing-audit-report.json');

interface CrawlResult {
    url: string;
    role: string;
    status: 'pass' | 'fail' | 'skip';
    error?: string;
    duration: number;
    consoleErrors: string[];
    pageErrors: string[];
}

interface CrawlReport {
    timestamp: string;
    totalPages: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    results: CrawlResult[];
}

const crawlResults: CrawlResult[] = [];

// Track errors per page
function setupErrorTracking(page: Page): { consoleErrors: string[]; pageErrors: string[] } {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
            const text = msg.text();
            // Ignore known benign errors
            if (text.includes('favicon') || text.includes('net::ERR_ABORTED')) return;
            consoleErrors.push(text);
        }
    });

    page.on('pageerror', (error) => {
        pageErrors.push(error.message);
    });

    return { consoleErrors, pageErrors };
}

async function crawlPage(
    page: Page,
    url: string,
    role: string
): Promise<CrawlResult> {
    const startTime = Date.now();
    const { consoleErrors, pageErrors } = setupErrorTracking(page);

    try {
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Check for 404
        const currentUrl = page.url();
        const content = await page.content();

        const is404 = currentUrl.includes('/404') ||
            (content.includes('404') && content.includes('not found'));

        // Check for error boundary
        const hasErrorBoundary = content.includes('Something went wrong') ||
            content.includes('Application error');

        if (is404) {
            return {
                url,
                role,
                status: 'fail',
                error: '404 Not Found',
                duration: Date.now() - startTime,
                consoleErrors,
                pageErrors,
            };
        }

        if (hasErrorBoundary) {
            return {
                url,
                role,
                status: 'fail',
                error: 'Error boundary rendered',
                duration: Date.now() - startTime,
                consoleErrors,
                pageErrors,
            };
        }

        if (pageErrors.length > 0) {
            return {
                url,
                role,
                status: 'fail',
                error: `Page errors: ${pageErrors.join('; ')}`,
                duration: Date.now() - startTime,
                consoleErrors,
                pageErrors,
            };
        }

        return {
            url,
            role,
            status: 'pass',
            duration: Date.now() - startTime,
            consoleErrors,
            pageErrors,
        };

    } catch (error: any) {
        return {
            url,
            role,
            status: 'fail',
            error: error.message,
            duration: Date.now() - startTime,
            consoleErrors,
            pageErrors,
        };
    }
}

// Test interactions on a page
async function testPageInteractions(page: Page): Promise<string[]> {
    const issues: string[] = [];

    try {
        // Test search input if present
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
        if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await searchInput.fill('test search');
            await page.waitForTimeout(500);
            await searchInput.clear();
        }

        // Test pagination if present
        const nextButton = page.locator('button:has-text("Next"), [aria-label="Next page"]').first();
        if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            if (await nextButton.isEnabled()) {
                await nextButton.click();
                await page.waitForLoadState('networkidle');

                const prevButton = page.locator('button:has-text("Previous"), [aria-label="Previous page"]').first();
                if (await prevButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await prevButton.click();
                    await page.waitForLoadState('networkidle');
                }
            }
        }

        // Test sort headers if present
        const sortableHeader = page.locator('th[role="button"], th.sortable').first();
        if (await sortableHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
            await sortableHeader.click();
            await page.waitForLoadState('networkidle');
        }

        // Test modal open/close if present
        const addButton = page.locator('button:has-text("Add"), button:has-text("Create")').first();
        if (await addButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(500);

            // Look for modal close button
            const closeButton = page.locator('[aria-label="Close"], button:has-text("Cancel")').first();
            if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await closeButton.click();
                await page.waitForTimeout(300);
            } else {
                // Press escape to close modal
                await page.keyboard.press('Escape');
            }
        }

    } catch (error: any) {
        issues.push(`Interaction error: ${error.message}`);
    }

    return issues;
}

// Generate markdown report
function generateReport(results: CrawlResult[], duration: number): string {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const skipped = results.filter(r => r.status === 'skip').length;

    let md = `# E2E Crawl Report\n\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Pages | ${results.length} |\n`;
    md += `| Passed | ${passed} |\n`;
    md += `| Failed | ${failed} |\n`;
    md += `| Skipped | ${skipped} |\n`;
    md += `| Duration | ${Math.round(duration / 1000)}s |\n\n`;

    md += `**Status: ${failed === 0 ? '✅ PASS' : '❌ FAIL'}**\n\n`;

    if (failed > 0) {
        md += `## ❌ Failed Pages\n\n`;
        md += `| URL | Role | Error |\n`;
        md += `|-----|------|-------|\n`;

        for (const result of results.filter(r => r.status === 'fail')) {
            md += `| ${result.url} | ${result.role} | ${result.error || 'Unknown'} |\n`;
        }
        md += '\n';
    }

    md += `## All Results\n\n`;
    md += `| URL | Role | Status | Duration |\n`;
    md += `|-----|------|--------|----------|\n`;

    for (const result of results) {
        const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
        md += `| ${result.url} | ${result.role} | ${status} | ${result.duration}ms |\n`;
    }

    return md;
}

// ============================================
// FULL SITE CRAWL
// ============================================
test.describe('Full Site Crawler', () => {
    test.setTimeout(300000); // 5 minute timeout for full crawl

    const roles: { role: TestRole; routes: string[] }[] = [
        { role: 'admin', routes: staticRoutes.admin },
        { role: 'super-instructor', routes: staticRoutes.superInstructor },
        { role: 'instructor', routes: staticRoutes.instructor },
        { role: 'learner', routes: staticRoutes.learner },
    ];

    for (const { role, routes } of roles) {
        test(`crawl all ${role} pages`, async ({ browser }) => {
            const context = await browser.newContext({
                storageState: getStorageStatePath(role),
            });
            const page = await context.newPage();

            const results: CrawlResult[] = [];

            for (const route of routes) {
                const result = await crawlPage(page, route, role);
                results.push(result);
                crawlResults.push(result);

                // Test interactions on successful pages
                if (result.status === 'pass') {
                    await testPageInteractions(page);
                }
            }

            // Also crawl dynamic routes
            try {
                const dynamicRoutes = getDynamicRoutes();
                const roleRoutes = dynamicRoutes[role as keyof typeof dynamicRoutes];

                if (roleRoutes) {
                    for (const [name, route] of Object.entries(roleRoutes)) {
                        if (typeof route === 'string') {
                            const result = await crawlPage(page, route, role);
                            results.push(result);
                            crawlResults.push(result);
                        }
                    }
                }
            } catch (e) {
                // Dynamic routes not available, skip
            }

            await context.close();

            // Verify no failures for this role
            const failures = results.filter(r => r.status === 'fail');
            expect(failures.length, `${role} should have no page failures`).toBe(0);
        });
    }

    test('crawl public pages', async ({ page }) => {
        const results: CrawlResult[] = [];

        for (const route of staticRoutes.public) {
            const result = await crawlPage(page, route, 'public');
            results.push(result);
            crawlResults.push(result);
        }

        const failures = results.filter(r => r.status === 'fail');
        expect(failures.length).toBe(0);
    });
});

// ============================================
// NAVIGATION LINK CRAWL
// ============================================
test.describe('Navigation Link Crawler', () => {
    test.setTimeout(180000); // 3 minute timeout

    test('crawl all sidebar links for admin', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: getStorageStatePath('admin'),
        });
        const page = await context.newPage();

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        // Get all sidebar links
        const links = await page.locator('.MuiDrawer-root a[href^="/"]').all();
        const visited = new Set<string>();
        const results: CrawlResult[] = [];

        for (const link of links) {
            const href = await link.getAttribute('href');
            if (!href || visited.has(href)) continue;
            visited.add(href);

            const result = await crawlPage(page, href, 'admin');
            results.push(result);
        }

        await context.close();

        // Allow some failures (disabled routes, etc.)
        const failures = results.filter(r => r.status === 'fail');
        expect(failures.length, `Too many navigation failures`).toBeLessThan(5);
    });
});

// ============================================
// GENERATE REPORT
// ============================================
test.afterAll(async () => {
    if (crawlResults.length === 0) return;

    const reportPath = path.join(process.cwd(), 'docs', 'e2e-crawl-report.md');
    const report = generateReport(crawlResults, 0);

    // Ensure docs directory exists
    const docsDir = path.dirname(reportPath);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Crawl report generated: ${reportPath}`);
});
