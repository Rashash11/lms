// Re-verification Test Script

const BASE_URL = 'http://localhost:3000';

async function loginAndGetCookie(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const setCookie = res.headers.get('set-cookie');
    const match = setCookie?.match(/session=([^;]+)/);
    return match ? match[1] : null;
}

async function testLogoutCookieClearing() {
    console.log('\n=== LOGOUT COOKIE CLEARING TEST ===\n');

    // Login
    const cookie = await loginAndGetCookie('admin@portal.com', 'Admin123!');
    console.log(`✓ Logged in, cookie: ${cookie ? 'YES' : 'NO'}`);

    // Logout
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Cookie': `session=${cookie}` }
    });

    console.log(`Logout status: ${logoutRes.status}`);

    const setCookie = logoutRes.headers.get('set-cookie');
    console.log(`\nSet-Cookie header: ${setCookie}\n`);

    const hasMaxAge0 = setCookie?.includes('Max-Age=0') || setCookie?.includes('max-age=0');
    const hasExpires = setCookie?.includes('expires=');
    const hasEmptyValue = setCookie?.includes('session=;') || setCookie?.includes('session="";');

    console.log(`✓ Has Max-Age=0: ${hasMaxAge0 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`✓ Has expires directive: ${hasExpires ? 'YES ✓' : 'NO ✗'}`);
    console.log(`✓ Cookie value empty: ${hasEmptyValue ? 'YES ✓' : 'NO ✗'}`);

    if (hasMaxAge0 && hasExpires) {
        console.log('\n✅ PASS - Cookie properly cleared!\n');
    } else {
        console.log('\n❌ FAIL - Cookie clearing incomplete\n');
    }
}

async function testUnauthenticatedEndpoints() {
    console.log('\n=== UNAUTHENTICATED ENDPOINT TESTS ===\n');

    const endpoints = [
        { name: '/api/users', url: `${BASE_URL}/api/users` },
        { name: '/api/courses', url: `${BASE_URL}/api/courses` }
    ];

    for (const endpoint of endpoints) {
        const res = await fetch(endpoint.url);
        const data = await res.json();

        console.log(`${endpoint.name}:`);
        console.log(`  Status: ${res.status} ${res.status === 401 ? '✓' : '✗'}`);
        console.log(`  Content-Type: ${res.headers.get('content-type')?.includes('json') ? 'JSON ✓' : 'NOT JSON ✗'}`);
        console.log(`  Response: ${JSON.stringify(data)}`);
        console.log();
    }
}

async function runFullVerification() {
    await testUnauthenticatedEndpoints();
    await testLogoutCookieClearing();

    console.log('\n=== VERIFICATION COMPLETE ===\n');
}

runFullVerification().catch(console.error);
