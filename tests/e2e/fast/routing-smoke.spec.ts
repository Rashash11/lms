/**
 * Routing Smoke Tests
 * 
 * Fast verification that all main routes load without errors.
 * Part of PR gate tests.
 */

import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import { staticRoutes } from '../fixtures/routes';
import { getStorageStatePath, loadSeedFixtures } from '../helpers/auth';

// Track errors during tests
let consoleErrors: string[] = [];
let pageErrors: string[] = [];

function setupErrorTracking(page: Page) {
    consoleErrors = [];
    pageErrors = [];

    page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
            // Ignore known benign errors
            const text = msg.text();
            if (text.includes('favicon') || text.includes('net::ERR_ABORTED')) return;
            consoleErrors.push(text);
        }
    });

    page.on('pageerror', (error) => {
        pageErrors.push(error.message);
    });
}

async function assertNoErrors() {
    expect(consoleErrors, 'No console errors').toHaveLength(0);
    expect(pageErrors, 'No page errors').toHaveLength(0);
}

async function assertNo404(page: Page) {
    const url = page.url();
    expect(url).not.toContain('/404');

    const content = await page.content();
    const is404 = content.includes('404') &&
        (content.includes('not found') || content.includes('Not Found'));
    expect(is404, `Page should not be 404: ${url}`).toBe(false);
}

async function assertNoErrorBoundary(page: Page) {
    const content = await page.content();
    const hasError = content.includes('Something went wrong') ||
        content.includes('Application error') ||
        content.includes('Error: ');
    expect(hasError, 'Page should not show error boundary').toBe(false);
}

// ============================================
// PUBLIC PAGES
// ============================================
test.describe('Public Pages', () => {
    test('should load login page', async ({ page }) => {
        setupErrorTracking(page);
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        await assertNo404(page);
        await assertNoErrorBoundary(page);

        // Verify login form exists
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should load signup page', async ({ page }) => {
        setupErrorTracking(page);
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');

        await assertNo404(page);
        await assertNoErrorBoundary(page);
    });

    test('should load forgot-password page', async ({ page }) => {
        setupErrorTracking(page);
        await page.goto('/forgot-password');
        await page.waitForLoadState('networkidle');

        await assertNo404(page);
        await assertNoErrorBoundary(page);
    });
});

// ============================================
// ADMIN ROUTES
// ============================================
test.describe('Admin Routes', () => {
    test.use({ storageState: getStorageStatePath('admin') });

    for (const route of staticRoutes.admin) {
        test(`should load ${route}`, async ({ page }) => {
            setupErrorTracking(page);
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            await assertNo404(page);
            await assertNoErrorBoundary(page);
        });
    }
});

// ============================================
// SUPER INSTRUCTOR ROUTES
// ============================================
test.describe('Super Instructor Routes', () => {
    test.use({ storageState: getStorageStatePath('super-instructor') });

    for (const route of staticRoutes.superInstructor) {
        test(`should load ${route}`, async ({ page }) => {
            setupErrorTracking(page);
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            await assertNo404(page);
            await assertNoErrorBoundary(page);
        });
    }
});

// ============================================
// INSTRUCTOR ROUTES
// ============================================
test.describe('Instructor Routes', () => {
    test.use({ storageState: getStorageStatePath('instructor') });

    for (const route of staticRoutes.instructor) {
        test(`should load ${route}`, async ({ page }) => {
            setupErrorTracking(page);
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            await assertNo404(page);
            await assertNoErrorBoundary(page);
        });
    }
});

// ============================================
// LEARNER ROUTES
// ============================================
test.describe('Learner Routes', () => {
    test.use({ storageState: getStorageStatePath('learner') });

    for (const route of staticRoutes.learner) {
        test(`should load ${route}`, async ({ page }) => {
            setupErrorTracking(page);
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            await assertNo404(page);
            await assertNoErrorBoundary(page);
        });
    }
});

// ============================================
// SIDEBAR NAVIGATION
// ============================================
test.describe('Sidebar Navigation', () => {
    test('admin sidebar links work', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: getStorageStatePath('admin'),
        });
        const page = await context.newPage();
        setupErrorTracking(page);

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        // Get sidebar links
        const sidebarLinks = page.locator('.MuiDrawer-root a[href^="/admin"]');
        const count = await sidebarLinks.count();

        // Click each link and verify
        const visited = new Set<string>();
        for (let i = 0; i < Math.min(count, 10); i++) {
            const link = sidebarLinks.nth(i);
            const href = await link.getAttribute('href');
            if (!href || visited.has(href)) continue;
            visited.add(href);

            await link.click();
            await page.waitForLoadState('networkidle');

            await assertNo404(page);
            await assertNoErrorBoundary(page);
        }

        await context.close();
    });

    test('learner sidebar links work', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: getStorageStatePath('learner'),
        });
        const page = await context.newPage();
        setupErrorTracking(page);

        await page.goto('/learner');
        await page.waitForLoadState('networkidle');

        // Get sidebar links (excluding disabled)
        const sidebarLinks = page.locator('.MuiDrawer-root a[href^="/learner"]:not(.Mui-disabled)');
        const count = await sidebarLinks.count();

        const visited = new Set<string>();
        for (let i = 0; i < Math.min(count, 10); i++) {
            const link = sidebarLinks.nth(i);
            const href = await link.getAttribute('href');
            if (!href || visited.has(href)) continue;
            visited.add(href);

            await link.click();
            await page.waitForLoadState('networkidle');

            await assertNo404(page);
            await assertNoErrorBoundary(page);
        }

        await context.close();
    });
});
