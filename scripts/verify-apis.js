/**
 * Comprehensive API Verification Script
 * Tests all API endpoints for database connectivity and functionality
 */

const fs = require('fs');
const BASE_URL = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];
const failureDetails = [];

async function testEndpoint(name, url, options = {}) {
    totalTests++;
    const method = options.method || 'GET';

    try {
        const response = await fetch(`${BASE_URL}${url}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        const isSuccess = options.expectedStatus
            ? response.status === options.expectedStatus
            : response.ok;

        const result = {
            name,
            method,
            url,
            status: response.status,
            success: isSuccess,
        };

        if (isSuccess) {
            passedTests++;
            console.log(`✓ ${name} (${method} ${url}) - ${response.status}`);

            if (response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json();
                result.data = data;
                return { success: true, data, status: response.status };
            }
            results.push(result);
            return { success: true, status: response.status };
        } else {
            failedTests++;
            const errorText = await response.text();
            console.log(`✗ ${name} (${method} ${url}) - ${response.status}`);
            result.error = errorText.substring(0, 200);
            failureDetails.push(result);
            results.push(result);
            return { success: false, status: response.status, error: errorText };
        }
    } catch (error) {
        failedTests++;
        console.log(`✗ ${name} (${method} ${url}) - ERROR: ${error.message}`);
        const result = {
            name,
            method,
            url,
            success: false,
            error: error.message,
        };
        failureDetails.push(result);
        results.push(result);
        return { success: false, error: error.message };
    }
}

async function runVerification() {
    console.log('\n=== LMS API Verification Suite ===\n');

    console.log('\n--- Phase 1: Health Check ---\n');
    await testEndpoint('Health Check', '/api/health');

    console.log('\n--- Phase 2: Authentication ---\n');
    await testEndpoint('Login', '/api/auth/login', {
        method: 'POST',
        body: { email: 'test@test.com', password: 'test123' },
        expectedStatus: 401,
    });

    const signupResult = await testEndpoint('Signup', '/api/auth/signup', {
        method: 'POST',
        body: {
            email: `test-${Date.now()}@test.com`,
            password: 'Test123!@#',
            username: `testuser${Date.now()}`,
            firstName: 'Test',
            lastName: 'User'
        },
    });

    console.log('\n--- Phase 3: Core Resources ---\n');
    await testEndpoint('Courses List', '/api/courses');
    await testEndpoint('Courses Search', '/api/courses?search=test');
    await testEndpoint('Learning Paths List', '/api/learning-paths');
    await testEndpoint('Users List', '/api/users');
    await testEndpoint('Users Search', '/api/users/search?q=test');
    await testEndpoint('Enrollments List', '/api/enrollments');
    await testEndpoint('Categories List', '/api/categories');
    await testEndpoint('Branches List', '/api/branches');
    await testEndpoint('Groups List', '/api/groups');

    console.log('\n--- Phase 4: Features ---\n');
    await testEndpoint('Notifications', '/api/notifications');
    await testEndpoint('Reports', '/api/reports');
    await testEndpoint('Certificates', '/api/certificates');
    await testEndpoint('Discussions', '/api/discussions');
    await testEndpoint('Automations', '/api/automations');
    await testEndpoint('Gamification', '/api/gamification');
    await testEndpoint('Leaderboard', '/api/gamification/leaderboard');
    await testEndpoint('Dashboard', '/api/dashboard');
    await testEndpoint('Catalog', '/api/catalog');
    await testEndpoint('Instructor Courses', '/api/instructor/courses');

    console.log('\n--- Phase 5: Create Operations ---\n');
    const courseResult = await testEndpoint('Create Course', '/api/courses', {
        method: 'POST',
        body: {
            title: `Test Course ${Date.now()}`,
            code: `TEST-${Date.now()}`,
            description: 'Automated test course',
            status: 'DRAFT',
        },
    });

    let testCourseId = null;
    if (courseResult.success && courseResult.data) {
        testCourseId = courseResult.data.id || courseResult.data.course?.id;
        console.log(`  Created course ID: ${testCourseId}`);
    }

    const lpResult = await testEndpoint('Create Learning Path', '/api/learning-paths', {
        method: 'POST',
        body: {
            name: `Test LP ${Date.now()}`,
            description: 'Test',
            status: 'inactive',
        },
    });

    let testLearningPathId = null;
    if (lpResult.success && lpResult.data) {
        testLearningPathId = lpResult.data.id || lpResult.data.learningPath?.id;
        console.log(`  Created learning path ID: ${testLearningPathId}`);
    }

    await testEndpoint('Create Category', '/api/categories', {
        method: 'POST',
        body: { name: `Test Category ${Date.now()}` },
    });

    await testEndpoint('Create Branch', '/api/branches', {
        method: 'POST',
        body: {
            name: `Test Branch ${Date.now()}`,
            slug: `test-${Date.now()}`,
            settings: {},
        },
    });

    await testEndpoint('Create Group', '/api/groups', {
        method: 'POST',
        body: { name: `Test Group ${Date.now()}` },
    });

    console.log('\n--- Phase 6: Nested Resources ---\n');
    if (testCourseId) {
        await testEndpoint('Get Course', `/api/courses/${testCourseId}`);
        await testEndpoint('Course Enrollments', `/api/courses/${testCourseId}/enrollments`);
        await testEndpoint('Course Units', `/api/courses/${testCourseId}/units`);
        await testEndpoint('Create Unit', `/api/courses/${testCourseId}/units`, {
            method: 'POST',
            body: {
                type: 'TEXT',
                title: 'Test Unit',
                content: { html: '<p>Test</p>' },
                order: 1,
            },
        });
    }

    if (testLearningPathId) {
        await testEndpoint('Get Learning Path', `/api/learning-paths/${testLearningPathId}`);
        await testEndpoint('LP Options', `/api/admin/learning-paths/${testLearningPathId}/options`);
        await testEndpoint('LP Sections', `/api/learning-paths/${testLearningPathId}/sections`);

        if (testCourseId) {
            await testEndpoint('Add Course to LP', `/api/learning-paths/${testLearningPathId}/courses`, {
                method: 'POST',
                body: { courseId: testCourseId, order: 1 },
            });
        }
    }

    // Write detailed results to file
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
        },
        results,
        failures: failureDetails,
    };

    fs.writeFileSync('scripts/verification-results.json', JSON.stringify(report, null, 2));

    console.log('\n=== Summary ===');
    console.log(`Total:   ${totalTests}`);
    console.log(`Passed:  ${passedTests}`);
    console.log(`Failed:  ${failedTests}`);
    console.log(`Rate:    ${report.summary.successRate}`);
    console.log('\nDetailed results written to: scripts/verification-results.json\n');

    if (failedTests > 0) {
        console.log('Failed tests:');
        failureDetails.forEach((f, i) => {
            console.log(`${i + 1}. ${f.name} - ${f.status || 'ERROR'}`);
        });
    }

    process.exit(failedTests > 0 ? 1 : 0);
}

runVerification().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
