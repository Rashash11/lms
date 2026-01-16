async function repro() {
    const BASE_URL = 'http://localhost:3000';

    // Login as learner
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'learner1@portal.com', password: 'Learner123!' })
    });

    if (!loginRes.ok) {
        console.log('Login failed');
        return;
    }

    const cookies = loginRes.headers.getSetCookie().join('; ');
    console.log('Logged in as learner');

    // Try to create course
    const res = await fetch(`${BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
        },
        body: JSON.stringify({
            title: 'Repro Bypass Course',
            description: 'This should fail with 403'
        })
    });

    console.log(`Status: ${res.status}`);
    const body = await res.json();
    console.log('Body:', JSON.stringify(body, null, 2));

    if (res.status === 201) {
        console.log('❌ VULNERABILITY REPRODUCED: Learner created a course!');
    } else if (res.status === 403) {
        console.log('✅ Correct: Learner denied course creation');
    }
}

repro().catch(console.error);
