// RBAC Enforcement Testing Script

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

async function testEndpoint(name, method, url, cookie, body = null) {
    try {
        const options = {
            method,
            headers: cookie ? { 'Cookie': `session=${cookie}` } : {}
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type');

        let data;
        try {
            data = await res.json();
        } catch (e) {
            data = await res.text();
        }

        console.log(`${name}: ${res.status} (${contentType?.includes('json') ? 'JSON' : 'NOT JSON'})`);

        if (res.status === 500) {
            console.log(`   ❌ 500 ERROR: ${JSON.stringify(data).substring(0, 200)}`);
        } else if (res.status === 403) {
            console.log(`   ✓ Correctly forbidden`);
        } else if (res.status === 201 || res.status === 200) {
            console.log(`   ✓ Success (${typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : 'OK'})`);
        } else if (res.status === 404) {
            console.log(`   ⚠️  Not found (might be expected)`);
        } else {
            console.log(`   Response: ${JSON.stringify(data).substring(0, 150)}`);
        }

        return { status: res.status, contentType, data };
    } catch (err) {
        console.log(`${name}: ERROR - ${err.message}`);
        return { error: err.message };
    }
}

async function testRBACEnforcement() {
    console.log('\n=== STEP 3: RBAC ENFORCEMENT ON ENDPOINTS ===\n');

    // Login all users
    const adminCookie = await loginAndGetCookie('admin@portal.com', 'Admin123!');
    const instructorCookie = await loginAndGetCookie('instructor@portal.com', 'Instructor123!');
    const learnerCookie = await loginAndGetCookie('learner1@portal.com', 'Learner123!');

    console.log('\n--- COURSES MODULE ---');
    await testEndpoint('ADMIN: POST /api/courses', 'POST', `${BASE_URL}/api/courses`, adminCookie, {
        code: 'TEST-' + Date.now(),
        title: 'Test Course',
        status: 'DRAFT'
    });

    await testEndpoint('LEARNER: POST /api/courses', 'POST', `${BASE_URL}/api/courses`, learnerCookie, {
        code: 'TEST2-' + Date.now(),
        title: 'Test Course 2',
        status: 'DRAFT'
    });

    await testEndpoint('INSTRUCTOR: DELETE /api/courses/fake-id', 'DELETE', `${BASE_URL}/api/courses/fake-id`, instructorCookie);

    console.log('\n--- LEARNING PATHS MODULE ---');
    await testEndpoint('ADMIN: POST /api/learning-paths', 'POST', `${BASE_URL}/api/learning-paths`, adminCookie, {
        name: 'Test Path ' + Date.now(),
        code: 'TP-' + Date.now()
    });

    await testEndpoint('LEARNER: POST /api/learning-paths', 'POST', `${BASE_URL}/api/learning-paths`, learnerCookie, {
        name: 'Test Path 2',
        code: 'TP2-' + Date.now()
    });

    console.log('\n--- ASSIGNMENTS MODULE ---');
    await testEndpoint('ADMIN: POST /api/assignments', 'POST', `${BASE_URL}/api/assignments`, adminCookie, {
        title: 'Test Assignment ' + Date.now(),
        description: 'Test description'
    });

    await testEndpoint('INSTRUCTOR: GET /api/assignments', 'GET', `${BASE_URL}/api/assignments`, instructorCookie);

    console.log('\n--- USERS MODULE ---');
    await testEndpoint('ADMIN: GET /api/users', 'GET', `${BASE_URL}/api/users`, adminCookie);
    await testEndpoint('LEARNER: GET /api/users', 'GET', `${BASE_URL}/api/users`, learnerCookie);

    console.log('\n--- REPORTS MODULE ---');
    await testEndpoint('ADMIN: GET /api/reports', 'GET', `${BASE_URL}/api/reports`, adminCookie);
    await testEndpoint('LEARNER: GET /api/reports', 'GET', `${BASE_URL}/api/reports`, learnerCookie);

    console.log('\n--- SKILLS MODULE ---');
    await testEndpoint('ADMIN: GET /api/skills', 'GET', `${BASE_URL}/api/skills`, adminCookie);
    await testEndpoint('INSTRUCTOR: GET /api/skills', 'GET', `${BASE_URL}/api/skills`, instructorCookie);
}

testRBACEnforcement().catch(console.error);
