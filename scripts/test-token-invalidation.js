const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testTokenInvalidation() {
    console.log('🔐 TESTING TOKEN INVALIDATION VIA LOGOUT-ALL\n');

    let cookies = {};

    // Test 1: Login and get a valid session
    console.log('1. Login as admin...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@portal.com', password: 'Admin123!' }),
    });

    if (loginRes.status !== 200) {
        console.error(`❌ Login failed: ${loginRes.status}`);
        process.exit(1);
    }

    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
        cookies.session = setCookie.split(';')[0].split('=')[1];
    }
    console.log('✅ Login OK\n');

    // Test 2: Verify session works with /me
    console.log('2. Testing /me with valid session...');
    const meRes1 = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Cookie': `session=${cookies.session}` },
    });

    if (meRes1.status !== 200) {
        console.error(`❌ /me failed: ${meRes1.status}`);
        process.exit(1);
    }
    console.log('✅ /me returns 200 (session valid)\n');

    // Test 3: Call logout-all
    console.log('3. Calling POST /api/auth/logout-all...');
    const logoutAllRes = await fetch(`${BASE_URL}/api/auth/logout-all`, {
        method: 'POST',
        headers: { 'Cookie': `session=${cookies.session}` },
    });

    if (logoutAllRes.status !== 200) {
        console.error(`❌ Logout-all failed: ${logoutAllRes.status}`);
        const body = await logoutAllRes.text();
        console.error('Response:', body);
        process.exit(1);
    }

    const logoutBody = await logoutAllRes.json();
    console.log(`✅ Logout-all OK: ${logoutBody.message}\n`);

    // Test 4: Try to use old session (should be revoked)
    console.log('4. Testing /me with OLD session (should be 401)...');
    const meRes2 = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Cookie': `session=${cookies.session}` },
    });

    if (meRes2.status === 401) {
        const errorBody = await meRes2.json();
        console.log(`✅ /me correctly returns 401: ${errorBody.message}`);
        console.log('✅ Token invalidation working!\n');
    } else {
        console.error(`❌ /me should return 401 but got: ${meRes2.status}`);
        process.exit(1);
    }

    console.log('🎉 TOKEN INVALIDATION TEST PASSED\n');
}

testTokenInvalidation()
    .catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });
