const BASE_URL = 'http://localhost:3000';

async function verifyAuth() {
    console.log('🔐 AUTH VERIFICATION\n');

    // 1. Login
    console.log('1. Testing POST /api/auth/login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@portal.com', password: 'Admin123!' }),
    });

    const loginBody = await loginRes.json();
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Body: ${JSON.stringify(loginBody)}`);

    const setCookie = loginRes.headers.get('set-cookie');
    console.log(`   Set-Cookie: ${setCookie?.substring(0, 80)}...`);

    if (loginRes.status !== 200) {
        console.log('❌ Login failed!');
        return;
    }
    console.log('   ✅ Login OK\n');

    // Extract session cookie
    const sessionCookie = setCookie?.split(';')[0] || '';

    // 2. Me endpoint
    console.log('2. Testing GET /api/auth/me...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: sessionCookie },
    });

    const meBody = await meRes.json();
    console.log(`   Status: ${meRes.status}`);
    console.log(`   Body: ${JSON.stringify(meBody)}`);

    if (meRes.status === 200 && meBody.claims?.role) {
        console.log(`   ✅ Me OK (role: ${meBody.claims.role})\n`);
    } else {
        console.log('   ❌ Me failed\n');
    }

    // 3. Permissions endpoint
    console.log('3. Testing GET /api/auth/permissions...');
    const permRes = await fetch(`${BASE_URL}/api/auth/permissions`, {
        headers: { Cookie: sessionCookie },
    });

    const permBody = await permRes.json();
    console.log(`   Status: ${permRes.status}`);
    console.log(`   Permissions count: ${permBody.permissions?.length || 0}`);
    console.log(`   First 5: ${(permBody.permissions || []).slice(0, 5).join(', ')}`);

    if (permRes.status === 200 && Array.isArray(permBody.permissions)) {
        console.log(`   ✅ Permissions OK\n`);
    } else {
        console.log('   ❌ Permissions failed\n');
    }

    // 4. 401 without cookie
    console.log('4. Testing 401 without cookie...');
    const noAuthRes = await fetch(`${BASE_URL}/api/auth/me`);
    const noAuthBody = await noAuthRes.json();
    console.log(`   Status: ${noAuthRes.status}`);
    console.log(`   Body: ${JSON.stringify(noAuthBody)}`);

    if (noAuthRes.status === 401) {
        console.log('   ✅ Returns 401 correctly\n');
    } else {
        console.log('   ❌ Should return 401\n');
    }

    // 5. Logout
    console.log('5. Testing POST /api/auth/logout...');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: sessionCookie },
    });

    const logoutBody = await logoutRes.json();
    console.log(`   Status: ${logoutRes.status}`);
    console.log(`   Body: ${JSON.stringify(logoutBody)}`);

    if (logoutRes.status === 200 && logoutBody.ok) {
        console.log('   ✅ Logout OK\n');
    } else {
        console.log('   ❌ Logout failed\n');
    }

    console.log('🎉 VERIFICATION COMPLETE');
}

verifyAuth().catch(e => console.error('Error:', e));
