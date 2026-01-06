// RBAC Permissions Testing Script

const BASE_URL = 'http://localhost:3000';

const TEST_USERS = [
    { role: 'ADMIN', email: 'admin@portal.com', password: 'Admin123!' },
    { role: 'INSTRUCTOR', email: 'instructor@portal.com', password: 'Instructor123!' },
    { role: 'LEARNER', email: 'learner1@portal.com', password: 'Learner123!' }
];

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

async function testRBACPermissions() {
    console.log('\n=== STEP 2: RBAC PERMISSIONS VERIFICATION ===\n');

    for (const user of TEST_USERS) {
        console.log(`\n--- Testing ${user.role} ---`);

        try {
            // Login
            const cookie = await loginAndGetCookie(user.email, user.password);
            if (!cookie) {
                console.log(`❌ FAIL - Could not login as ${user.role}`);
                continue;
            }

            // Get permissions
            const permRes = await fetch(`${BASE_URL}/api/auth/permissions`, {
                headers: { 'Cookie': `session=${cookie}` }
            });

            console.log(`Status: ${permRes.status}`);

            if (permRes.status !== 200) {
                const errorData = await permRes.json();
                console.log(`❌ ERROR: ${JSON.stringify(errorData)}`);
                continue;
            }

            const permData = await permRes.json();
            const permissions = permData.permissions || [];

            console.log(`Permissions count: ${permissions.length}`);
            console.log(`Sample permissions: ${permissions.slice(0, 5).join(', ')}`);

            // Verify expected permissions
            if (user.role === 'ADMIN') {
                const hasCourseCreate = permissions.some(p => p.includes('course:create') || p.includes('courses:create'));
                const hasCourseDelete = permissions.some(p => p.includes('course:delete') || p.includes('courses:delete'));
                const hasUserCreate = permissions.some(p => p.includes('user:create') || p.includes('users:create'));
                console.log(`✓ course:create: ${hasCourseCreate ? 'YES' : 'NO'}`);
                console.log(`✓ course:delete_any: ${hasCourseDelete ? 'YES' : 'NO'}`);
                console.log(`✓ user:create: ${hasUserCreate ? 'YES' : 'NO'}`);
            } else if (user.role === 'INSTRUCTOR') {
                const hasCourseCreate = permissions.some(p => p.includes('course:create') || p.includes('courses:create'));
                const hasCourseDelete = permissions.some(p => p.includes('course:delete_any') || p.includes('courses:delete_any'));
                console.log(`✓ course:create: ${hasCourseCreate ? 'YES' : 'NO'}`);
                console.log(`✓ SHOULD NOT have course:delete_any: ${!hasCourseDelete ? 'PASS' : 'FAIL'}`);
            } else if (user.role === 'LEARNER') {
                const hasCourseCreate = permissions.some(p => p.includes('course:create') || p.includes('courses:create'));
                const hasCourseDelete = permissions.some(p => p.includes('course:delete'));
                console.log(`✓ SHOULD NOT have course:create: ${!hasCourseCreate ? 'PASS' : 'FAIL'}`);
                console.log(`✓ SHOULD NOT have course:delete: ${!hasCourseDelete ? 'PASS' : 'FAIL'}`);
            }

        } catch (err) {
            console.log(`❌ ERROR: ${err.message}`);
        }
    }
}

testRBACPermissions().catch(console.error);
