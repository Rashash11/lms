// Quick test to debug cookie/auth issue
const BASE_URL = 'http://localhost:3000';

async function test() {
    console.log('1. Testing login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'learner1@portal.com',
            password: 'Learner123!'
        })
    });

    console.log('Login status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);

    // Extract cookies
    const cookies = loginRes.headers.get('set-cookie');
    console.log('Set-Cookie header:', cookies);

    // Try /me endpoint
    console.log('\n2. Testing /me with cookies...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
            'Cookie': cookies || ''
        }
    });

    console.log('ME status:', meRes.status);
    const meData = await meRes.json();
    console.log('ME response:', meData);
}

test().catch(console.error);
