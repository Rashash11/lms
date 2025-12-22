// Smoke Test Script for Admin Portal
// Tests all core CRUD operations via API endpoints

const BASE_URL = 'http://localhost:3000';

// Helper to make requests
async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();
    return { status: response.status, data };
}

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    tests: [],
};

function logTest(name, passed, details = '') {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${name}`);
    if (details) console.log(`  ${details}`);

    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
}

// Test 1: Health Check
async function testHealth() {
    console.log('\n=== PHASE 1: Health Check ===');
    try {
        const { status, data } = await request('/api/health');
        logTest('Health endpoint responds', status === 200);
        logTest('Database connected', data.ok && data.db === 'connected', `User count: ${data.userCount}`);
    } catch (error) {
        logTest('Health endpoint', false, error.message);
    }
}

// Test 2: Users CRUD
async function testUsers() {
    console.log('\n=== PHASE 2: Users CRUD ===');
    let userId = null;

    try {
        // Create user
        const createData = {
            username: `smoketest_${Date.now()}`,
            email: `smoketest_${Date.now()}@example.com`,
            firstName: 'Smoke',
            lastName: 'Test',
            password: 'TestPassword123!',
            roles: ['LEARNER'],
        };

        const { status: createStatus, data: createData2 } = await request('/api/users', {
            method: 'POST',
            body: JSON.stringify(createData),
        });

        logTest('Create user via API', createStatus === 201 || createStatus === 200, `Status: ${createStatus}`);

        if (createData2.user) {
            userId = createData2.user.id;
            logTest('User has ID in response', !!userId, `ID: ${userId}`);
        }

        // List users
        const { status: listStatus, data: listData } = await request('/api/users');
        logTest('List users via API', listStatus === 200);
        logTest('Users list contains data', Array.isArray(listData.users) && listData.users.length > 0, `Count: ${listData.users?.length || 0}`);

        // Search users
        const { status: searchStatus } = await request('/api/users/search?q=Smoke');
        logTest('Search users via API', searchStatus === 200);

        // Update user (if we have an ID)
        if (userId) {
            const { status: updateStatus } = await request(`/api/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ firstName: 'Updated' }),
            });
            logTest('Update user via API', updateStatus === 200, `Updated user ${userId}`);

            // Delete user
            const { status: deleteStatus } = await request(`/api/users/${userId}`, {
                method: 'DELETE',
            });
            logTest('Delete user via API', deleteStatus === 200 || deleteStatus === 204, `Deleted user ${userId}`);
        }
    } catch (error) {
        logTest('Users CRUD operations', false, error.message);
    }
}

// Test 3: Courses CRUD
async function testCourses() {
    console.log('\n=== PHASE 3: Courses CRUD ===');
    let courseId = null;

    try {
        // Create course
        const createData = {
            title: `Smoke Test Course ${Date.now()}`,
            description: 'Test course created by smoke test',
            status: 'DRAFT',
        };

        const { status: createStatus, data: createData2 } = await request('/api/courses', {
            method: 'POST',
            body: JSON.stringify(createData),
        });

        logTest('Create course via API', createStatus === 201 || createStatus === 200, `Status: ${createStatus}`);

        if (createData2.course) {
            courseId = createData2.course.id;
            logTest('Course has ID in response', !!courseId, `ID: ${courseId}`);
        }

        // List courses
        const { status: listStatus, data: listData } = await request('/api/courses');
        logTest('List courses via API', listStatus === 200);
        logTest('Courses list contains data', Array.isArray(listData.courses), `Count: ${listData.courses?.length || 0}`);

        // Filter by status
        const { status: filterStatus } = await request('/api/courses?status=DRAFT');
        logTest('Filter courses by status', filterStatus === 200);

        // Update course (if we have an ID)
        if (courseId) {
            const { status: updateStatus } = await request(`/api/courses/${courseId}`, {
                method: 'PUT',
                body: JSON.stringify({ title: 'Updated Test Course' }),
            });
            logTest('Update course via API', updateStatus === 200, `Updated course ${courseId}`);

            // Delete course
            const { status: deleteStatus } = await request(`/api/courses/${courseId}`, {
                method: 'DELETE',
            });
            logTest('Delete course via API', deleteStatus === 200 || deleteStatus === 204, `Deleted course ${courseId}`);
        }
    } catch (error) {
        logTest('Courses CRUD operations', false, error.message);
    }
}

// Test 4: Groups CRUD
async function testGroups() {
    console.log('\n=== PHASE 4: Groups CRUD ===');
    let groupId = null;

    try {
        // Create group
        const createData = {
            name: `Smoke Test Group ${Date.now()}`,
            description: 'Test group created by smoke test',
        };

        const { status: createStatus, data: createData2 } = await request('/api/groups', {
            method: 'POST',
            body: JSON.stringify(createData),
        });

        logTest('Create group via API', createStatus === 201 || createStatus === 200, `Status: ${createStatus}`);

        if (createData2.group) {
            groupId = createData2.group.id;
            logTest('Group has ID in response', !!groupId, `ID: ${groupId}`);
        }

        // List groups
        const { status: listStatus, data: listData } = await request('/api/groups');
        logTest('List groups via API', listStatus === 200);
        logTest('Groups list contains data', Array.isArray(listData.groups), `Count: ${listData.groups?.length || 0}`);

        // Update group (if we have an ID)
        if (groupId) {
            const { status: updateStatus } = await request(`/api/groups/${groupId}`, {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated Test Group' }),
            });
            logTest('Update group via API', updateStatus === 200, `Updated group ${groupId}`);

            // Delete group
            const { status: deleteStatus } = await request(`/api/groups/${groupId}`, {
                method: 'DELETE',
            });
            logTest('Delete group via API', deleteStatus === 200 || deleteStatus === 204, `Deleted group ${groupId}`);
        }
    } catch (error) {
        logTest('Groups CRUD operations', false, error.message);
    }
}

// Test 5: Branches CRUD
async function testBranches() {
    console.log('\n=== PHASE 5: Branches CRUD ===');
    let branchId = null;

    try {
        // Create branch
        const createData = {
            name: `Smoke Test Branch ${Date.now()}`,
            slug: `smoke-test-${Date.now()}`,
            tenantId: '00000000-0000-0000-0000-000000000000', // Default tenant
            settings: {},
        };

        const { status: createStatus, data: createData2 } = await request('/api/branches', {
            method: 'POST',
            body: JSON.stringify(createData),
        });

        logTest('Create branch via API', createStatus === 201 || createStatus === 200, `Status: ${createStatus}`);

        if (createData2.branch) {
            branchId = createData2.branch.id;
            logTest('Branch has ID in response', !!branchId, `ID: ${branchId}`);
        }

        // List branches
        const { status: listStatus, data: listData } = await request('/api/branches');
        logTest('List branches via API', listStatus === 200);

        // Update branch (if we have an ID)
        if (branchId) {
            const { status: updateStatus } = await request(`/api/branches/${branchId}`, {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated Test Branch' }),
            });
            logTest('Update branch via API', updateStatus === 200, `Updated branch ${branchId}`);

            // Delete branch
            const { status: deleteStatus } = await request(`/api/branches/${branchId}`, {
                method: 'DELETE',
            });
            logTest('Delete branch via API', deleteStatus === 200 || deleteStatus === 204, `Deleted branch ${branchId}`);
        }
    } catch (error) {
        logTest('Branches CRUD operations', false, error.message);
    }
}

// Run all tests
async function runTests() {
    console.log('🔥 Starting Smoke Tests...\n');
    console.log(`Testing against: ${BASE_URL}\n`);

    await testHealth();
    await testUsers();
    await testCourses();
    await testGroups();
    await testBranches();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SMOKE TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✓ Passed: ${results.passed}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`Total: ${results.tests.length}`);
    console.log('='.repeat(50));

    if (results.failed > 0) {
        console.log('\nFailed tests:');
        results.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
