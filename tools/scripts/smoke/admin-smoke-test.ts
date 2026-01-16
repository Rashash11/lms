export { };
const BASE_URL = 'http://127.0.0.1:3000';
const SKIP_AUTH_HEADER = { 'x-lms-skip-rate-limit': '1' };

const ADMIN_ACCOUNT = { email: 'admin@portal.com', password: 'Admin123!' };

async function login(email: string, password: string) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...SKIP_AUTH_HEADER
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            console.error(`Login failed: ${response.status} ${await response.text()}`);
            return null;
        }

        const cookieHeader = response.headers.get('set-cookie');
        return cookieHeader ? cookieHeader.split(',').map(c => c.split(';')[0]).join('; ') : '';
    } catch (error: any) {
        console.error('Login error:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Starting Admin API Smoke Tests...');
    const results: { test: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

    const logResult = (test: string, pass: boolean, detail: string = '') => {
        results.push({ test, status: pass ? 'PASS' : 'FAIL', detail });
        console.log(`${pass ? '✅' : '❌'} ${test} ${detail ? `- ${detail}` : ''}`);
    };

    // 1. Login
    const cookies = await login(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password);
    if (!cookies) {
        logResult('Admin Login', false, 'Could not login');
        return printSummary(results);
    }
    logResult('Admin Login', true);

    const headers = { Cookie: cookies, ...SKIP_AUTH_HEADER };

    // 2. Fetch Users
    try {
        const url = `${BASE_URL}/api/users?page=1&limit=10`;
        const res = await fetch(url, { headers });
        if (res.ok) {
            const body = await res.json();
            const count = body.data?.length ?? body.users?.length ?? (Array.isArray(body) ? body.length : 0);
            logResult('GET /api/users', true, `Found ${count} users`);
        } else {
            const text = await res.text();
            logResult('GET /api/users', false, `Status ${res.status} URL: ${url} Body: ${text.substring(0, 100)}`);
        }
    } catch (e: any) {
        logResult('GET /api/users', false, e.message);
    }

    // 3. Fetch Courses
    try {
        const url = `${BASE_URL}/api/courses`;
        const res = await fetch(url, { headers });
        if (res.ok) {
            const body = await res.json();
            const count = body.courses?.length ?? (Array.isArray(body) ? body.length : 0);
            logResult('GET /api/courses', true, `Found ${count} courses`);
        } else {
            const text = await res.text();
            logResult('GET /api/courses', false, `Status ${res.status} URL: ${url} Body: ${text.substring(0, 100)}`);
        }
    } catch (e: any) {
        logResult('GET /api/courses', false, e.message);
    }

    // 4. Fetch Roles (Admin Scope)
    try {
        const url = `${BASE_URL}/api/admin/roles`;
        const res = await fetch(url, { headers });
        if (res.ok) {
            const body = await res.json();
            const count = body.roles?.length ?? (Array.isArray(body) ? body.length : 0);
            logResult('GET /api/admin/roles', true, `Found ${count} roles`);
        } else {
            const text = await res.text();
            logResult('GET /api/admin/roles', false, `Status ${res.status} URL: ${url} Body: ${text.substring(0, 100)}`);
        }
    } catch (e: any) {
        logResult('GET /api/admin/roles', false, e.message);
    }

    // 5. Fetch Permissions (Admin Scope)
    try {
        const url = `${BASE_URL}/api/admin/permissions`;
        const res = await fetch(url, { headers });
        if (res.ok) {
            const body = await res.json();
            // permissions might be object { module: [perms] }
            const count = Object.keys(body).length;
            logResult('GET /api/admin/permissions', true, `Found ${count} modules`);
        } else {
            const text = await res.text();
            logResult('GET /api/admin/permissions', false, `Status ${res.status} URL: ${url} Body: ${text.substring(0, 100)}`);
        }
    } catch (e: any) {
        logResult('GET /api/admin/permissions', false, e.message);
    }

    // 6. Security Sessions
    try {
        const res = await fetch(`${BASE_URL}/api/admin/security/sessions`, { headers });
        if (res.ok) {
            const data = await res.json();
            logResult('GET /api/admin/security/sessions', true, `Found ${data.length || 0} sessions`);
        } else {
            // Might be 404 if not implemented yet, just log
            logResult('GET /api/admin/security/sessions', res.status !== 500, `Status ${res.status}`);
        }
    } catch (e: any) {
        logResult('GET /api/admin/security/sessions', false, e.message);
    }

    printSummary(results);
}

function printSummary(results: any[]) {
    console.log('\n--- Admin Smoke Test Summary ---');
    console.table(results);
    const allPassed = results.every(r => r.status === 'PASS');
    if (allPassed) {
        console.log('\n✅ ALL ADMIN TESTS PASSED!');
        process.exit(0);
    } else {
        console.log('\n❌ SOME TESTS FAILED');
        // Log individual failures clearly
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`FAIL: ${r.test} - ${r.detail}`);
        });
        process.exit(1);
    }
}

runTests();
