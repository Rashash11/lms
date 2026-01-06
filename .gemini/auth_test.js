// Using native fetch (Node 18+)

const BASE_URL = 'http://localhost:3000';
let sessionCookie = null;

async function parseSetCookie(response) {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
        const match = setCookie.match(/session=([^;]+)/);
        return match ? match[1] : null;
    }
    return null;
}

async function testAuthFlow() {
    console.log('\n=== STEP 1: AUTH FLOW VERIFICATION ===\n');

    // A) Login with admin credentials
    console.log('A) POST /api/auth/login (admin)');
    try {
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@portal.com',
                password: 'Admin123!'
            })
        });

        const loginData = await loginRes.json();
        console.log(`   Status: ${loginRes.status}`);
        console.log(`   Response: ${JSON.stringify(loginData).substring(0, 200)}`);

        const setCookieHeader = loginRes.headers.get('set-cookie');
        console.log(`   Set-Cookie: ${setCookieHeader ? setCookieHeader.substring(0, 100) + '...' : 'MISSING'}`);

        sessionCookie = await parseSetCookie(loginRes);
        console.log(`   ✓ Session cookie extracted: ${sessionCookie ? 'YES' : 'NO'}\n`);

        if (!sessionCookie) {
            console.log('   ❌ FAIL - No session cookie received\n');
            return;
        }
    } catch (err) {
        console.log(`   ❌ ERROR: ${err.message}\n`);
        return;
    }

    // B) GET /api/auth/me WITH cookie
    console.log('B) GET /api/auth/me (with cookie)');
    try {
        const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { 'Cookie': `session=${sessionCookie}` }
        });
        const meData = await meRes.json();
        console.log(`   Status: ${meRes.status}`);
        console.log(`   Response: ${JSON.stringify(meData).substring(0, 200)}`);
        console.log(`   ✓ Has userId: ${meData.user?.id ? 'YES' : 'NO'}\n`);
    } catch (err) {
        console.log(`   ❌ ERROR: ${err.message}\n`);
    }

    // C) GET /api/auth/me WITHOUT cookie
    console.log('C) GET /api/auth/me (no cookie)');
    try {
        const noAuthRes = await fetch(`${BASE_URL}/api/auth/me`);
        const noAuthData = await noAuthRes.json();
        console.log(`   Status: ${noAuthRes.status}`);
        console.log(`   Response: ${JSON.stringify(noAuthData)}`);
        console.log(`   ✓ Correct 401: ${noAuthRes.status === 401 ? 'YES' : 'NO'}\n`);
    } catch (err) {
        console.log(`   ❌ ERROR: ${err.message}\n`);
    }

    // D) POST /api/auth/logout
    console.log('D) POST /api/auth/logout (with cookie)');
    try {
        const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Cookie': `session=${sessionCookie}` }
        });
        const logoutData = await logoutRes.json();
        console.log(`   Status: ${logoutRes.status}`);
        console.log(`   Response: ${JSON.stringify(logoutData)}`);
        const logoutSetCookie = logoutRes.headers.get('set-cookie');
        console.log(`   ✓ Cookie cleared: ${logoutSetCookie?.includes('Max-Age=0') ? 'YES' : 'NO'}\n`);
    } catch (err) {
        console.log(`   ❌ ERROR: ${err.message}\n`);
    }

    // E) Login again for logout-all test
    console.log('E) POST /api/auth/logout-all test');
    try {
        // Re-login
        const reloginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@portal.com',
                password: 'Admin123!'
            })
        });
        const newCookie = await parseSetCookie(reloginRes);

        if (newCookie) {
            const logoutAllRes = await fetch(`${BASE_URL}/api/auth/logout-all`, {
                method: 'POST',
                headers: { 'Cookie': `session=${newCookie}` }
            });
            console.log(`   Logout-all status: ${logoutAllRes.status}`);

            // Try old cookie
            const testOldRes = await fetch(`${BASE_URL}/api/auth/me`, {
                headers: { 'Cookie': `session=${newCookie}` }
            });
            console.log(`   Old cookie after logout-all: ${testOldRes.status} (expect 401)`);
            console.log(`   ✓ Token revocation works: ${testOldRes.status === 401 ? 'YES' : 'NO'}\n`);
        }
    } catch (err) {
        console.log(`   ⚠️  /api/auth/logout-all may not exist: ${err.message}\n`);
    }
}

testAuthFlow().catch(console.error);
