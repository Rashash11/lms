/**
 * Smoke Test: Authentication
 * Run: npx tsx tests/smoke/auth.smoke.ts
 */
async function runSmokeTest() {
    console.log('🚀 Starting Auth Smoke Test...');
    const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

    try {
        // 1. Health check
        const health = await fetch(`${baseUrl}/api/health`);
        if (!health.ok) throw new Error('Health check failed');
        console.log('✅ Health check passed');

        // 2. Login
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@zedny.com', password: 'password123' }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (loginRes.status !== 200) throw new Error(`Login failed: ${loginRes.status}`);
        const cookies = loginRes.headers.get('set-cookie');
        console.log('✅ Login successful');

        // 3. User Me profile check
        const meRes = await fetch(`${baseUrl}/api/me`, {
            headers: { cookie: cookies || '' }
        });
        const user = await meRes.json();
        if (user.email !== 'admin@zedny.com') throw new Error('User profile mismatch');
        console.log('✅ User profile verified');

        console.log('🎉 SMOKE TEST PASSED');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ SMOKE TEST FAILED:', err.message);
        process.exit(1);
    }
}

runSmokeTest();
