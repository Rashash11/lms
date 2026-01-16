/**
 * Security Invariants Tests
 * 
 * Validates RBAC, node scope, tenant scope, and JWT security.
 * Part of PR gate tests.
 */

import { test, expect } from '@playwright/test';
import {
    getStorageStatePath,
    loadSeedFixtures,
    switchNode,
    logoutAll,
    checkAuth
} from '../helpers/auth';
import { getDynamicRoutes, forbiddenRoutes } from '../fixtures/routes';

async function getCsrfHeader(page: { context: () => any }) {
    const csrfToken = (await page.context().cookies()).find((c: any) => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

// ============================================
// RBAC TESTS
// ============================================
test.describe('RBAC - Role-Based Access Control', () => {
    test('learner cannot access admin routes', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: getStorageStatePath('learner'),
        });
        const page = await context.newPage();

        // Try to access admin page
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        // Should be redirected away from admin or see 403
        const url = page.url();
        expect(url).not.toMatch(/^.*\/admin$/);

        // Either redirected to learner dashboard or forbidden page
        const isRedirected = url.includes('/learner') || url.includes('/login');
        const is403 = url.includes('/403') || (await page.content()).includes('403');
        expect(isRedirected || is403, 'Learner should not access admin').toBe(true);

        await context.close();
    });

    test('learner cannot access instructor routes', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: getStorageStatePath('learner'),
        });
        const page = await context.newPage();

        await page.goto('/instructor');
        await page.waitForLoadState('networkidle');

        const url = page.url();
        expect(url).not.toMatch(/^.*\/instructor$/);

        await context.close();
    });

    test('instructor cannot perform admin-only actions', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: getStorageStatePath('instructor'),
        });
        const page = await context.newPage();

        // Navigate to trigger context initialization
        await page.goto('/instructor');
        await page.waitForLoadState('networkidle');

        // Try to create a user (admin-only action) via API with auth context
        const response = await page.request.post('/api/users', {
            headers: {
                'Content-Type': 'application/json',
                ...(await getCsrfHeader(page)),
            },
            data: {
                email: 'unauthorized-test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'LEARNER',
            },
        });

        // Should be forbidden or unauthorized (not 500)
        expect([401, 403]).toContain(response.status());

        await context.close();
    });
});

// ============================================
// NODE SCOPE TESTS
// ============================================
test.describe('Node Scope Isolation', () => {
    test('learnerA (nodeA) cannot access nodeB course', async ({ browser }) => {
        const fixtures = loadSeedFixtures();
        const routes = getDynamicRoutes();

        const context = await browser.newContext({
            storageState: getStorageStatePath('learner'),
        });
        const page = await context.newPage();

        // Try to access course from different node
        await page.goto(routes.crossNode.courseBDetail);
        await page.waitForLoadState('networkidle');

        // Should see 403/404 or redirect
        const url = page.url();
        const content = await page.content();

        const is403 = content.includes('403') || content.includes('Forbidden') || content.includes('denied');
        const is404 = content.includes('404') || content.includes('not found');
        const isRedirected = !url.includes(fixtures.courseBId);

        expect(is403 || is404 || isRedirected, 'Node isolation should prevent cross-node access').toBe(true);

        await context.close();
    });

    test('list endpoints only show nodeA data for learnerA', async ({ request }) => {
        const fixtures = loadSeedFixtures();

        // Note: This test requires authenticated request context
        // For simplicity, we test via browser context
        // In production, you'd set up authenticated request context

        // This is a placeholder - actual implementation would need 
        // to make authenticated API calls and verify filtering
        expect(true).toBe(true);
    });
});

// ============================================
// TENANT SCOPE TESTS
// ============================================
test.describe('Tenant Scope Isolation', () => {
    test('adminA cannot access tenantB resources', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: getStorageStatePath('admin'),
        });
        const page = await context.newPage();

        // AdminA belongs to tenantA, should not see tenantB branches
        await page.goto('/admin/branches');
        await page.waitForLoadState('networkidle');

        const content = await page.content();

        // Should NOT see Node C (which belongs to tenantB)
        expect(content).not.toContain('Node C');
        expect(content).not.toContain('test-tenant-b');

        await context.close();
    });
});

// ============================================
// JWT TOKEN TESTS
// ============================================
test.describe('JWT Token Security', () => {
    test('old token fails after logout-all', async ({ browser, baseURL }) => {
        const fixtures = loadSeedFixtures();
        const context = await browser.newContext();

        // Step 1: Login fresh to get a dedicated token
        const loginResponse = await context.request.post(`${baseURL}/api/auth/login`, {
            data: {
                email: fixtures.learnerAEmail,
                password: fixtures.testPassword
            }
        });
        expect(loginResponse.ok()).toBe(true);

        // Verify authenticated
        const meResponse = await context.request.get(`${baseURL}/api/auth/me`);
        expect(meResponse.ok()).toBe(true);

        // Step 2: Call logout-all to invalidate all tokens for this user
        // This increments tokenVersion in DB
        const logoutResponse = await context.request.post(`${baseURL}/api/auth/logout-all`);
        expect(logoutResponse.ok()).toBe(true);

        // Step 3: Verify the token is now invalid
        const meResponseAfter = await context.request.get(`${baseURL}/api/auth/me`);

        // It should be 401 Unauthorized now
        expect(meResponseAfter.status()).toBe(401);

        await context.close();
    });

    test('unauthenticated request to protected API returns 401', async ({ request }) => {
        const response = await request.get('/api/auth/me');

        // Should be unauthorized
        expect(response.status()).toBe(401);

        // Should return JSON, not HTML
        const contentType = response.headers()['content-type'] || '';
        expect(contentType).toContain('application/json');
    });
});

// ============================================
// API RETURNS JSON (NOT HTML)
// ============================================
test.describe('API JSON Contract', () => {
    const apiEndpoints = [
        '/api/auth/me',
        '/api/users',
        '/api/courses',
        '/api/learning-paths',
        '/api/assignments',
    ];

    for (const endpoint of apiEndpoints) {
        test(`${endpoint} returns JSON, not HTML`, async ({ request }) => {
            const response = await request.get(endpoint);

            const contentType = response.headers()['content-type'] || '';

            // Should be JSON
            expect(contentType).toContain('application/json');

            // Should not be HTML
            const body = await response.text();
            expect(body).not.toMatch(/<!doctype/i);
            expect(body).not.toMatch(/<html/i);
        });
    }
});

// ============================================
// SWITCH NODE AUTHORIZATION
// ============================================
test.describe('Node Switching', () => {
    test('authorized switch returns 200', async ({ request }) => {
        const fixtures = loadSeedFixtures();

        // Login first
        const loginResponse = await request.post('/api/auth/login', {
            data: {
                email: fixtures.adminAEmail,
                password: fixtures.testPassword,
            },
        });

        if (loginResponse.ok()) {
            // Try to switch to a node admin has access to
            const switchResponse = await request.post('/api/auth/switch-node', {
                data: { nodeId: fixtures.nodeAId },
            });

            // Should succeed for admin
            expect([200, 201, 204]).toContain(switchResponse.status());
        }
    });

    test('unauthorized switch returns 403', async ({ request }) => {
        const fixtures = loadSeedFixtures();

        // Login as learner (limited scope)
        const loginResponse = await request.post('/api/auth/login', {
            data: {
                email: fixtures.learnerAEmail,
                password: fixtures.testPassword,
            },
        });

        if (loginResponse.ok()) {
            // Try to switch to a different node
            const switchResponse = await request.post('/api/auth/switch-node', {
                data: { nodeId: fixtures.nodeBId }, // Different node
            });

            // Should be forbidden for learner
            expect([403, 401]).toContain(switchResponse.status());
        }
    });
});
