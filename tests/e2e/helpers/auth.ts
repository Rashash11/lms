/**
 * Playwright Auth Helpers
 * 
 * Handles authentication state management for E2E tests.
 */

import { APIRequestContext, Browser, BrowserContext, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load seed fixtures
const fixturesPath = path.join(__dirname, '../fixtures/seed.json');

export interface SeedFixtures {
    tenantAId: string;
    tenantBId: string;
    nodeAId: string;
    nodeBId: string;
    nodeCId: string;
    adminAId: string;
    adminAEmail: string;
    superInstructorAId: string;
    superInstructorAEmail: string;
    instructorAId: string;
    instructorAEmail: string;
    learnerAId: string;
    learnerAEmail: string;
    learnerBId: string;
    learnerBEmail: string;
    adminBId: string;
    adminBEmail: string;
    categoryAId: string;
    groupAId: string;
    courseAId: string;
    courseBId: string;
    sectionAId: string;
    unitVideoId: string;
    unitDocumentId: string;
    unitQuizId: string;
    lpAId: string;
    enrollmentAId: string;
    lpEnrollmentAId: string;
    assignmentAId: string;
    submissionAId: string;
    skillAId: string;
    conferenceAId: string;
    calendarEventAId: string;
    notificationAId: string;
    automationAId: string;
    testPassword: string;
}

export function loadSeedFixtures(): SeedFixtures {
    if (!fs.existsSync(fixturesPath)) {
        throw new Error(`Seed fixtures not found at ${fixturesPath}. Run 'npm run test:setup' first.`);
    }
    return JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_DIR = path.join(__dirname, '../storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export type TestRole = 'admin' | 'super-instructor' | 'instructor' | 'learner' | 'learner-b' | 'admin-b';

export function getStorageStatePath(role: TestRole): string {
    return path.join(STORAGE_DIR, `${role}.json`);
}

/**
 * Login via API and return session cookies
 */
export async function loginViaApi(
    requestContext: APIRequestContext,
    email: string,
    password: string
): Promise<{ success: boolean; cookies: any[] }> {
    const response = await requestContext.post(`${BASE_URL}/api/auth/login`, {
        data: { email, password },
    });

    if (!response.ok()) {
        console.error(`Login failed for ${email}: ${response.status()}`);
        return { success: false, cookies: [] };
    }

    const cookies = await response.headers()['set-cookie'];
    return { success: true, cookies: cookies ? [cookies] : [] };
}

/**
 * Create authenticated browser context for a role
 */
export async function createAuthenticatedContext(
    browser: Browser,
    role: TestRole
): Promise<BrowserContext> {
    const storagePath = getStorageStatePath(role);

    if (!fs.existsSync(storagePath)) {
        throw new Error(`Storage state not found for role: ${role}. Run auth state generation first.`);
    }

    return browser.newContext({
        storageState: storagePath,
    });
}

/**
 * Generate storage states for all test roles
 */
export async function generateStorageStates(): Promise<void> {
    const fixtures = loadSeedFixtures();

    const roles: { role: TestRole; email: string }[] = [
        { role: 'admin', email: fixtures.adminAEmail },
        { role: 'super-instructor', email: fixtures.superInstructorAEmail },
        { role: 'instructor', email: fixtures.instructorAEmail },
        { role: 'learner', email: fixtures.learnerAEmail },
        { role: 'learner-b', email: fixtures.learnerBEmail },
        { role: 'admin-b', email: fixtures.adminBEmail },
    ];

    const apiContext = await request.newContext({
        baseURL: BASE_URL,
    });

    console.log('🔐 Generating auth storage states...\n');

    for (const { role, email } of roles) {
        console.log(`   Logging in as ${role} (${email})...`);

        const response = await apiContext.post('/api/auth/login', {
            data: { email, password: fixtures.testPassword },
        });

        if (!response.ok()) {
            console.error(`   ❌ Login failed for ${role}: ${response.status()}`);
            continue;
        }

        // Get cookies from response
        const cookies = response.headers()['set-cookie'];

        // Create storage state object
        const storageState = {
            cookies: cookies ? parseCookies(cookies, BASE_URL) : [],
            origins: [],
        };

        const storagePath = getStorageStatePath(role);
        fs.writeFileSync(storagePath, JSON.stringify(storageState, null, 2));
        console.log(`   ✅ Saved: ${storagePath}`);
    }

    await apiContext.dispose();
    console.log('\n✅ All storage states generated!');
}

/**
 * Parse Set-Cookie header into Playwright cookie format
 */
function parseCookies(setCookieHeader: string, baseUrl: string): any[] {
    const url = new URL(baseUrl);
    const cookies: any[] = [];

    // Handle multiple cookies (split by comma, but be careful with expires)
    const cookieStrings = setCookieHeader.split(/,(?=\s*\w+=)/);

    for (const cookieStr of cookieStrings) {
        const parts = cookieStr.trim().split(';');
        const [nameValue, ...attributes] = parts;
        const [name, value] = nameValue.split('=');

        if (!name || !value) continue;

        const cookie: any = {
            name: name.trim(),
            value: value.trim(),
            domain: url.hostname,
            path: '/',
            httpOnly: false,
            secure: url.protocol === 'https:',
            sameSite: 'Lax',
        };

        for (const attr of attributes) {
            const [attrName, attrValue] = attr.trim().split('=');
            const lowerName = attrName.toLowerCase();

            if (lowerName === 'httponly') cookie.httpOnly = true;
            if (lowerName === 'secure') cookie.secure = true;
            if (lowerName === 'path') cookie.path = attrValue || '/';
            if (lowerName === 'domain') cookie.domain = attrValue || url.hostname;
            if (lowerName === 'samesite') cookie.sameSite = attrValue || 'Lax';
            if (lowerName === 'expires') {
                cookie.expires = new Date(attrValue).getTime() / 1000;
            }
            if (lowerName === 'max-age') {
                cookie.expires = Date.now() / 1000 + parseInt(attrValue, 10);
            }
        }

        cookies.push(cookie);
    }

    return cookies;
}

/**
 * Switch node context via API
 */
export async function switchNode(
    requestContext: APIRequestContext,
    nodeId: string
): Promise<{ success: boolean; status: number }> {
    const response = await requestContext.post(`${BASE_URL}/api/auth/switch-node`, {
        data: { nodeId },
    });

    return {
        success: response.ok(),
        status: response.status(),
    };
}

/**
 * Logout all sessions via API (for token invalidation tests)
 */
export async function logoutAll(
    requestContext: APIRequestContext
): Promise<{ success: boolean; status: number }> {
    const response = await requestContext.post(`${BASE_URL}/api/auth/logout-all`);

    return {
        success: response.ok(),
        status: response.status(),
    };
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(
    requestContext: APIRequestContext
): Promise<{ authenticated: boolean; user?: any }> {
    const response = await requestContext.get(`${BASE_URL}/api/me`);

    if (!response.ok()) {
        return { authenticated: false };
    }

    const data = await response.json();
    return { authenticated: true, user: data.user };
}
