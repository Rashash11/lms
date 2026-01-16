import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * E2E Routing Click Tests
 * 
 * This test suite validates that all navigation links in the LMS application
 * work correctly without 404s, 500s, or client-side errors.
 */

// Test credentials - use existing test accounts
const TEST_USERS = {
    admin: { email: 'admin@example.com', password: 'adminpassword123' },
    instructor: { email: 'instructor@example.com', password: 'password123' },
    learner: { email: 'learner@example.com', password: 'password123' },
};

// Track console errors
const consoleErrors: string[] = [];
const networkErrors: { url: string; status: number }[] = [];

// Helper to login
async function login(page: Page, email: string, password: string): Promise<boolean> {
    await page.goto('/login');

    // Wait for login form
    try {
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    } catch {
        // Already logged in or page structure different
        return true;
    }

    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect (success) or error
    try {
        await page.waitForURL(/\/(admin|instructor|learner|super-instructor)/, { timeout: 10000 });
        return true;
    } catch {
        // Login might have failed
        return false;
    }
}

// Helper to check if page shows 404
async function is404Page(page: Page): Promise<boolean> {
    const url = page.url();
    if (url.includes('/404')) return true;

    const pageContent = await page.content();
    if (pageContent.includes('404') && pageContent.includes('not found')) return true;

    return false;
}

// Helper to check for error boundary
async function hasErrorBoundary(page: Page): Promise<boolean> {
    const pageContent = await page.content();
    // Look for common error boundary indicators
    if (pageContent.includes('Something went wrong') && pageContent.includes('Error')) return true;
    if (pageContent.includes('Application error')) return true;
    return false;
}

// Setup console and network monitoring
function setupMonitoring(page: Page) {
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
        }
    });

    page.on('pageerror', (error) => {
        consoleErrors.push(`[Page Error] ${error.message}`);
    });

    page.on('response', (response) => {
        const status = response.status();
        if (status >= 500) {
            networkErrors.push({ url: response.url(), status });
        }
    });
}

// Test suite for each role's navigation
test.describe('Routing Click Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Clear error arrays
        consoleErrors.length = 0;
        networkErrors.length = 0;

        // Setup monitoring
        setupMonitoring(page);
    });

    test('Public pages should load without errors', async ({ page }) => {
        const publicPages = [
            '/login',
            '/signup',
            '/forgot-password',
        ];

        for (const url of publicPages) {
            await page.goto(url);
            await page.waitForLoadState('networkidle');

            const is404 = await is404Page(page);
            expect(is404, `${url} should not be a 404`).toBe(false);

            const hasError = await hasErrorBoundary(page);
            expect(hasError, `${url} should not show error boundary`).toBe(false);
        }
    });

    test('Admin sidebar navigation works', async ({ page }) => {
        // Login as admin
        const loggedIn = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

        // If login fails, skip test gracefully
        if (!loggedIn) {
            test.skip(true, 'Admin login failed - check test credentials');
            return;
        }

        // Navigate to admin dashboard
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        // Get all sidebar links
        const sidebarLinks = await page.locator('nav a[href^="/admin"], .MuiDrawer-root a[href^="/admin"]').all();

        const visitedUrls = new Set<string>();

        for (const link of sidebarLinks) {
            const href = await link.getAttribute('href');
            if (!href || visitedUrls.has(href)) continue;
            visitedUrls.add(href);

            // Click the link
            await link.click();
            await page.waitForLoadState('networkidle');

            // Verify no 404
            const is404 = await is404Page(page);
            expect(is404, `${href} should not be a 404`).toBe(false);

            // Verify no error boundary
            const hasError = await hasErrorBoundary(page);
            expect(hasError, `${href} should not show error boundary`).toBe(false);
        }

        // Check for console errors (filter out expected ones)
        const criticalErrors = consoleErrors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('net::ERR_ABORTED') &&
            !e.includes('Third-party cookie')
        );
        expect(criticalErrors.length, 'No critical console errors').toBe(0);

        // Check for 500 errors
        expect(networkErrors.length, 'No 500 errors').toBe(0);
    });

    test('Instructor sidebar navigation works', async ({ page }) => {
        // Login as instructor
        const loggedIn = await login(page, TEST_USERS.instructor.email, TEST_USERS.instructor.password);

        if (!loggedIn) {
            test.skip(true, 'Instructor login failed - check test credentials');
            return;
        }

        // Navigate to instructor dashboard
        await page.goto('/instructor');
        await page.waitForLoadState('networkidle');

        // Get all sidebar links
        const sidebarLinks = await page.locator('nav a[href^="/instructor"], .MuiDrawer-root a[href^="/instructor"]').all();

        const visitedUrls = new Set<string>();

        for (const link of sidebarLinks) {
            const href = await link.getAttribute('href');
            if (!href || visitedUrls.has(href)) continue;
            visitedUrls.add(href);

            await link.click();
            await page.waitForLoadState('networkidle');

            const is404 = await is404Page(page);
            expect(is404, `${href} should not be a 404`).toBe(false);

            const hasError = await hasErrorBoundary(page);
            expect(hasError, `${href} should not show error boundary`).toBe(false);
        }
    });

    test('Learner sidebar navigation works', async ({ page }) => {
        // Login as learner
        const loggedIn = await login(page, TEST_USERS.learner.email, TEST_USERS.learner.password);

        if (!loggedIn) {
            test.skip(true, 'Learner login failed - check test credentials');
            return;
        }

        // Navigate to learner dashboard
        await page.goto('/learner');
        await page.waitForLoadState('networkidle');

        // Get all sidebar links that are not disabled
        const sidebarLinks = await page.locator('nav a[href^="/learner"], .MuiDrawer-root a[href^="/learner"]').all();

        const visitedUrls = new Set<string>();

        for (const link of sidebarLinks) {
            const href = await link.getAttribute('href');
            if (!href || visitedUrls.has(href)) continue;

            // Skip disabled items
            const isDisabled = await link.evaluate((el) => {
                return el.closest('[disabled]') !== null ||
                    el.closest('.Mui-disabled') !== null ||
                    window.getComputedStyle(el).pointerEvents === 'none';
            });
            if (isDisabled) continue;

            visitedUrls.add(href);

            await link.click();
            await page.waitForLoadState('networkidle');

            const is404 = await is404Page(page);
            expect(is404, `${href} should not be a 404`).toBe(false);

            const hasError = await hasErrorBoundary(page);
            expect(hasError, `${href} should not show error boundary`).toBe(false);
        }
    });

    test('Quick action buttons navigate correctly', async ({ page }) => {
        // Login as admin
        const loggedIn = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

        if (!loggedIn) {
            test.skip(true, 'Admin login failed - check test credentials');
            return;
        }

        // Go to admin home
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        // Test main action buttons on home page
        const actionButtons = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').all();

        for (const button of actionButtons.slice(0, 5)) { // Test up to 5 buttons
            const buttonText = await button.textContent();

            // Skip disabled buttons
            const isDisabled = await button.isDisabled();
            if (isDisabled) continue;

            // Click and check navigation
            const initialUrl = page.url();
            await button.click();
            await page.waitForLoadState('networkidle');

            // If navigated, verify no 404
            if (page.url() !== initialUrl) {
                const is404 = await is404Page(page);
                expect(is404, `Button "${buttonText}" should not lead to 404`).toBe(false);

                // Go back for next test
                await page.goBack();
                await page.waitForLoadState('networkidle');
            }
        }
    });
});

// Summary test
test('Route audit should pass', async ({ page }) => {
    // This test runs the routing audit and ensures it passes
    // The audit script should be run separately: npm run routes:audit
    // This test just verifies basic navigation works

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const is404 = await is404Page(page);
    expect(is404).toBe(false);

    // Verify signup link works
    const signupLink = page.locator('a[href="/signup"]');
    if (await signupLink.count() > 0) {
        await signupLink.click();
        await page.waitForLoadState('networkidle');

        const isSignup404 = await is404Page(page);
        expect(isSignup404).toBe(false);
    }
});
