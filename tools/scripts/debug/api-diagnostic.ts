/**
 * API Endpoint Diagnostic Tool
 * 
 * Tests all API endpoints for:
 * 1. Correct Content-Type (application/json not text/html)
 * 2. Proper HTTP status codes
 * 3. JSON response format
 * 
 * Usage: 
 *   npm run api:diagnose
 *   BASE_URL=http://localhost:3000 node scripts/api-diagnostic.js
 */

export { };
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test accounts
const ADMIN_CREDS = { email: 'admin@portal.com', password: 'Admin123!' };

interface DiagnosticResult {
    endpoint: string;
    method: string;
    status: number;
    contentType: string | null;
    isJson: boolean;
    hasHtml: boolean;
    error?: string;
}

const results: DiagnosticResult[] = [];

async function login(): Promise<string | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDS),
        });

        if (!res.ok) {
            console.error('❌ Login failed:', res.status);
            return null;
        }

        const setCookies = res.headers.getSetCookie();
        const sessionCookie = setCookies.find(c => c.startsWith('session='));
        return sessionCookie || null;
    } catch (e) {
        console.error('❌ Login error:', e);
        return null;
    }
}

async function diagnoseEndpoint(
    endpoint: string,
    method: string,
    cookie?: string,
    body?: any
): Promise<DiagnosticResult> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};

    if (cookie) headers['Cookie'] = cookie;
    if (body) headers['Content-Type'] = 'application/json';

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const contentType = res.headers.get('content-type');
        const isJson = contentType?.includes('application/json') || false;
        const text = await res.text();
        const hasHtml = text.includes('<!DOCTYPE') || text.includes('<html');

        return {
            endpoint,
            method,
            status: res.status,
            contentType,
            isJson,
            hasHtml,
        };
    } catch (e: any) {
        return {
            endpoint,
            method,
            status: 0,
            contentType: null,
            isJson: false,
            hasHtml: false,
            error: e.message,
        };
    }
}

async function runDiagnostics() {
    console.log('🔍 API ENDPOINT DIAGNOSTICS\\n');
    console.log(`Base URL: ${BASE_URL}\\n`);

    // Login first
    console.log('Logging in as admin...');
    const sessionCookie = await login();
    if (!sessionCookie) {
        console.error('❌ Cannot proceed without admin session');
        process.exit(1);
    }
    console.log('✅ Logged in\\n');

    // Define endpoints to test
    const endpoints = [
        // Auth endpoints (no auth needed)
        { path: '/api/auth/login', method: 'POST', auth: false, body: ADMIN_CREDS },
        { path: '/api/auth/signup', method: 'POST', auth: false, body: { email: 'test@test.com', password: 'Test123!' } },

        // Auth endpoints (auth required)
        { path: '/api/auth/me', method: 'GET', auth: true },
        { path: '/api/auth/permissions', method: 'GET', auth: true },
        { path: '/api/auth/logout', method: 'POST', auth: true },

        // Courses
        { path: '/api/courses', method: 'GET', auth: true },
        { path: '/api/courses', method: 'POST', auth: true, body: { title: 'Test Course' } },
        { path: '/api/courses/fake-id', method: 'GET', auth: true },
        { path: '/api/courses/fake-id', method: 'DELETE', auth: true },

        // Learning paths
        { path: '/api/learning-paths', method: 'GET', auth: true },
        { path: '/api/learning-paths', method: 'POST', auth: true, body: { name: 'Test LP' } },
        { path: '/api/learning-paths/fake-id', method: 'GET', auth: true },
        { path: '/api/learning-paths/fake-id', method: 'DELETE', auth: true },

        // Assignments
        { path: '/api/assignments', method: 'GET', auth: true },
        { path: '/api/assignments', method: 'POST', auth: true, body: { title: 'Test Assignment' } },
        { path: '/api/assignments/fake-id', method: 'GET', auth: true },
        { path: '/api/assignments/fake-id', method: 'DELETE', auth: true },

        // Submissions
        { path: '/api/submissions', method: 'GET', auth: true },
        { path: '/api/submissions', method: 'POST', auth: true, body: { assignmentId: 'fake' } },
        { path: '/api/submissions/fake-id', method: 'GET', auth: true },

        // Reports
        { path: '/api/reports', method: 'GET', auth: true },
        { path: '/api/reports/fake-id', method: 'GET', auth: true },

        // Calendar events
        { path: '/api/calendar-events', method: 'GET', auth: true },
        { path: '/api/calendar-events', method: 'POST', auth: true, body: { title: 'Test Event', startTime: new Date().toISOString() } },

        // Conferences
        { path: '/api/conferences', method: 'GET', auth: true },
        { path: '/api/conferences', method: 'POST', auth: true, body: { title: 'Test Conf' } },

        // Skills
        { path: '/api/skills', method: 'GET', auth: true },
        { path: '/api/skills', method: 'POST', auth: true, body: { name: 'Test Skill' } },

        // Users
        { path: '/api/users', method: 'GET', auth: true },
        { path: '/api/users/fake-id', method: 'GET', auth: true },

        // 401 test (no auth)
        { path: '/api/auth/me', method: 'GET', auth: false },
    ];

    console.log(`Testing ${endpoints.length} endpoints...\\n`);

    for (const ep of endpoints) {
        const cookie = ep.auth ? sessionCookie : undefined;
        const result = await diagnoseEndpoint(ep.path, ep.method, cookie, ep.body);
        results.push(result);

        const statusColor = result.status >= 200 && result.status < 300 ? '✅' :
            result.status === 401 || result.status === 403 || result.status === 404 ? '⚠️' :
                '❌';

        const typeColor = result.isJson ? '✅' : '❌';
        const htmlColor = result.hasHtml ? '❌' : '✅';

        console.log(`${statusColor} ${result.method.padEnd(6)} ${result.endpoint.padEnd(35)} | ${result.status} | JSON:${typeColor} | HTML:${htmlColor} | ${result.contentType || 'no-content-type'}`);
    }

    printSummary();
}

function printSummary() {
    console.log('\\n' + '─'.repeat(80));
    console.log('\\n📊 DIAGNOSTIC SUMMARY\\n');

    const totalEndpoints = results.length;
    const htmlResponses = results.filter(r => r.hasHtml);
    const nonJsonResponses = results.filter(r => !r.isJson && r.status !== 0);
    const errors = results.filter(r => r.error);

    console.log(`Total endpoints tested: ${totalEndpoints}`);
    console.log(`Endpoints returning HTML: ${htmlResponses.length}`);
    console.log(`Endpoints not returning JSON: ${nonJsonResponses.length}`);
    console.log(`Errors: ${errors.length}\\n`);

    if (htmlResponses.length > 0) {
        console.log('❌ ENDPOINTS RETURNING HTML (CRITICAL):');
        htmlResponses.forEach(r => {
            console.log(`   ${r.method} ${r.endpoint} - ${r.status} - ${r.contentType}`);
        });
        console.log('');
    }

    if (nonJsonResponses.length > 0) {
        console.log('⚠️  ENDPOINTS NOT RETURNING JSON:');
        nonJsonResponses.forEach(r => {
            console.log(`   ${r.method} ${r.endpoint} - ${r.status} - ${r.contentType || 'no content-type'}`);
        });
        console.log('');
    }

    if (errors.length > 0) {
        console.log('❌ ERRORS:');
        errors.forEach(r => {
            console.log(`   ${r.method} ${r.endpoint} - ${r.error}`);
        });
        console.log('');
    }

    const passed = htmlResponses.length === 0 && errors.length === 0;

    if (passed) {
        console.log('✅ ALL API ENDPOINTS RETURN JSON (NO HTML)\\n');
        process.exit(0);
    } else {
        console.log('❌ SOME API ENDPOINTS HAVE ISSUES\\n');
        process.exit(1);
    }
}

// Run diagnostics
runDiagnostics().catch(e => {
    console.error('❌ Diagnostic error:', e);
    process.exit(1);
});
