export { };
/**
 * RBAC Smoke Test Script
 * 
 * Tests role-based access control on Course API endpoints:
 * 1. ADMIN → can create/delete courses
 * 2. INSTRUCTOR → can create courses, cannot delete
 * 3. LEARNER → cannot create or delete courses
 * 
 * Run: npm run rbac:smoke
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test accounts from seed data
const TEST_ACCOUNTS = {
    ADMIN: { email: 'admin-a@test.local', password: 'TestPass123!' },
    INSTRUCTOR: { email: 'instructor-a@test.local', password: 'TestPass123!' },
    LEARNER: { email: 'learner-a@test.local', password: 'TestPass123!' },
};

interface TestResult {
    name: string;
    passed: boolean;
    details?: string;
}

const results: TestResult[] = [];

function parseCookies(setCookieHeaders: string[]): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const header of setCookieHeaders) {
        const match = header.match(/^([^=]+)=([^;]*)/);
        if (match) {
            cookies[match[1]] = match[2];
        }
    }
    return cookies;
}

function buildCookieHeader(cookies: Record<string, string>): string {
    return Object.entries(cookies)
        .filter(([_, v]) => v && v.length > 0)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
}

function logResult(name: string, passed: boolean, details?: string) {
    results.push({ name, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}${details ? ` - ${details}` : ''}`);
}

async function login(email: string, password: string): Promise<Record<string, string> | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-lms-skip-rate-limit': process.env.SKIP_RATE_LIMIT === '1' ? '1' : '0'
            },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.error(`   ❌ Login failed for ${email}: status=${res.status}`, body);
            return null;
        }

        const setCookies = res.headers.getSetCookie();
        return parseCookies(setCookies);
    } catch (err: any) {
        console.error(`   ❌ Login error for ${email}:`, err.message);
        return null;
    }
}

function getHeaders(cookies: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cookie': buildCookieHeader(cookies),
    };
    if (cookies['csrf-token']) {
        headers['x-csrf-token'] = cookies['csrf-token'];
    }
    return headers;
}

async function testCourseCreate(cookies: Record<string, string>): Promise<{ status: number; ok: boolean }> {
    const res = await fetch(`${BASE_URL}/api/courses`, {
        method: 'POST',
        headers: getHeaders(cookies),
        body: JSON.stringify({
            title: `RBAC Test Course ${Date.now()}`,
            description: 'Test course for RBAC smoke test',
        }),
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.status === 200 || res.status === 201 };
}

async function testCourseDelete(cookies: Record<string, string>, courseId?: string): Promise<{ status: number; ok: boolean }> {
    // Use a fake ID - we just want to test permission, not actually delete
    const testId = courseId || 'test-id-does-not-exist';

    const res = await fetch(`${BASE_URL}/api/courses/${testId}`, {
        method: 'DELETE',
        headers: getHeaders(cookies),
    });

    // 403 = permission denied (expected for non-admin)
    // 404 = not found (means permission passed but course doesn't exist)
    // 200 = success
    return {
        status: res.status,
        ok: res.status === 200 || res.status === 404 // 404 means permission check passed
    };
}

async function runTests() {
    console.log('\n🔒 RBAC Smoke Tests (Courses)\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log('─'.repeat(60) + '\n');

    // ─────────────────────────────────────────────────────────────
    // GLOBAL SETUP: Login once for each role
    // ─────────────────────────────────────────────────────────────
    let adminCookies: Record<string, string> | null = null;
    let instructorCookies: Record<string, string> | null = null;
    let learnerCookies: Record<string, string> | null = null;

    console.log('Logging in as ADMIN...');
    adminCookies = await login(TEST_ACCOUNTS.ADMIN.email, TEST_ACCOUNTS.ADMIN.password);
    if (!adminCookies) {
        console.error('❌ Failed to login as ADMIN. Aborting tests.');
        process.exit(1);
    }

    console.log('Logging in as INSTRUCTOR...');
    instructorCookies = await login(TEST_ACCOUNTS.INSTRUCTOR.email, TEST_ACCOUNTS.INSTRUCTOR.password);
    if (!instructorCookies) {
        console.error('❌ Failed to login as INSTRUCTOR. Aborting tests.');
        process.exit(1);
    }

    console.log('Logging in as LEARNER...');
    learnerCookies = await login(TEST_ACCOUNTS.LEARNER.email, TEST_ACCOUNTS.LEARNER.password);
    if (!learnerCookies) {
        console.error('❌ Failed to login as LEARNER. Aborting tests.');
        process.exit(1);
    }

    console.log('✅ Logins successful. Starting RBAC checks...\n');

    // ─────────────────────────────────────────────────────────────
    // Test 1: ADMIN can create courses
    // ─────────────────────────────────────────────────────────────
    let createdCourseId: string | undefined;

    try {
        const result = await testCourseCreate(adminCookies);
        if (result.ok) {
            logResult('1. ADMIN can create course', true, `status=${result.status}`);
        } else {
            logResult('1. ADMIN can create course', false, `status=${result.status}, expected 200/201`);
        }
    } catch (e: any) {
        logResult('1. ADMIN can create course', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 2: ADMIN can delete courses
    // ─────────────────────────────────────────────────────────────
    try {
        const result = await testCourseDelete(adminCookies);
        if (result.ok) {
            logResult('2. ADMIN can delete course', true, `status=${result.status}`);
        } else {
            logResult('2. ADMIN can delete course', false, `status=${result.status}, expected 200/404`);
        }
    } catch (e: any) {
        logResult('2. ADMIN can delete course', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 3: INSTRUCTOR can create courses
    // ─────────────────────────────────────────────────────────────
    try {
        const result = await testCourseCreate(instructorCookies);
        if (result.ok) {
            logResult('3. INSTRUCTOR can create course', true, `status=${result.status}`);
        } else {
            logResult('3. INSTRUCTOR can create course', false, `status=${result.status}, expected 200/201`);
        }
    } catch (e: any) {
        logResult('3. INSTRUCTOR can create course', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 4: INSTRUCTOR cannot delete courses
    // ─────────────────────────────────────────────────────────────
    try {
        const result = await testCourseDelete(instructorCookies);
        // Expected: 403 (permission denied)
        if (result.status === 403) {
            logResult('4. INSTRUCTOR denied course delete', true, 'Correctly returns 403');
        } else {
            logResult('4. INSTRUCTOR denied course delete', false, `status=${result.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('4. INSTRUCTOR denied course delete', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 5: LEARNER cannot create courses
    // ─────────────────────────────────────────────────────────────
    try {
        const result = await testCourseCreate(learnerCookies);
        // Expected: 403 (permission denied)
        if (result.status === 403) {
            logResult('5. LEARNER denied course create', true, 'Correctly returns 403');
        } else {
            logResult('5. LEARNER denied course create', false, `status=${result.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('5. LEARNER denied course create', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 6: LEARNER cannot delete courses
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');

        const result = await testCourseDelete(learnerCookies);
        // Expected: 403 (permission denied)
        if (result.status === 403) {
            logResult('6. LEARNER denied course delete', true, 'Correctly returns 403');
        } else {
            logResult('6. LEARNER denied course delete', false, `status=${result.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('6. LEARNER denied course delete', false, e.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // LEARNING PATHS TESTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📚 Learning Paths Tests\n');

    // ─────────────────────────────────────────────────────────────
    // Test 7: ADMIN can create learning path
    // ─────────────────────────────────────────────────────────────
    try {
        if (!adminCookies) throw new Error('No admin session');

        const res = await fetch(`${BASE_URL}/api/learning-paths`, {
            method: 'POST',
            headers: getHeaders(adminCookies),
            body: JSON.stringify({
                name: `RBAC Test LP ${Date.now()}`,
            }),
        });

        if (res.status === 200 || res.status === 201) {
            logResult('7. ADMIN can create LP', true, `status=${res.status}`);
        } else {
            logResult('7. ADMIN can create LP', false, `status=${res.status}, expected 200/201`);
        }
    } catch (e: any) {
        logResult('7. ADMIN can create LP', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 8: ADMIN can delete learning path
    // ─────────────────────────────────────────────────────────────
    try {
        if (!adminCookies) throw new Error('No admin session');

        const res = await fetch(`${BASE_URL}/api/learning-paths/fake-lp-id`, {
            method: 'DELETE',
            headers: getHeaders(adminCookies),
        });

        // 404 = permission passed, resource doesn't exist
        if (res.status === 200 || res.status === 404) {
            logResult('8. ADMIN can delete LP', true, `status=${res.status}`);
        } else {
            logResult('8. ADMIN can delete LP', false, `status=${res.status}, expected 200/404`);
        }
    } catch (e: any) {
        logResult('8. ADMIN can delete LP', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 9: INSTRUCTOR can create learning path
    // ─────────────────────────────────────────────────────────────
    try {
        if (!instructorCookies) throw new Error('No instructor session');

        const res = await fetch(`${BASE_URL}/api/learning-paths`, {
            method: 'POST',
            headers: getHeaders(instructorCookies),
            body: JSON.stringify({
                name: `Instructor LP ${Date.now()}`,
            }),
        });

        if (res.status === 200 || res.status === 201) {
            logResult('9. INSTRUCTOR can create LP', true, `status=${res.status}`);
        } else {
            logResult('9. INSTRUCTOR can create LP', false, `status=${res.status}, expected 200/201`);
        }
    } catch (e: any) {
        logResult('9. INSTRUCTOR can create LP', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 10: INSTRUCTOR cannot delete learning path
    // ─────────────────────────────────────────────────────────────
    try {
        if (!instructorCookies) throw new Error('No instructor session');

        const res = await fetch(`${BASE_URL}/api/learning-paths/fake-lp-id`, {
            method: 'DELETE',
            headers: getHeaders(instructorCookies),
        });

        if (res.status === 403) {
            logResult('10. INSTRUCTOR denied LP delete', true, 'Correctly returns 403');
        } else {
            logResult('10. INSTRUCTOR denied LP delete', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('10. INSTRUCTOR denied LP delete', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 11: LEARNER cannot create learning path
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');

        const res = await fetch(`${BASE_URL}/api/learning-paths`, {
            method: 'POST',
            headers: getHeaders(learnerCookies),
            body: JSON.stringify({
                name: `Learner LP ${Date.now()}`,
            }),
        });

        if (res.status === 403) {
            logResult('11. LEARNER denied LP create', true, 'Correctly returns 403');
        } else {
            logResult('11. LEARNER denied LP create', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('11. LEARNER denied LP create', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 12: LEARNER cannot delete learning path
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');

        const res = await fetch(`${BASE_URL}/api/learning-paths/fake-lp-id`, {
            method: 'DELETE',
            headers: getHeaders(learnerCookies),
        });

        if (res.status === 403) {
            logResult('12. LEARNER denied LP delete', true, 'Correctly returns 403');
        } else {
            logResult('12. LEARNER denied LP delete', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('12. LEARNER denied LP delete', false, e.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // ASSIGNMENTS & GRADING TESTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📝 Assignments & Grading Tests\n');

    // ─────────────────────────────────────────────────────────────
    // Test 13: ADMIN can create assignment
    // ─────────────────────────────────────────────────────────────
    try {
        if (!adminCookies) throw new Error('No admin session');

        const res = await fetch(`${BASE_URL}/api/assignments`, {
            method: 'POST',
            headers: getHeaders(adminCookies),
            body: JSON.stringify({
                title: `Admin Assignment ${Date.now()}`,
                description: 'Test assignment from admin',
            }),
        });

        if (res.status === 200 || res.status === 201) {
            logResult('13. ADMIN can create assignment', true, `status=${res.status}`);
        } else {
            logResult('13. ADMIN can create assignment', false, `status=${res.status}, expected 200/201`);
        }
    } catch (e: any) {
        logResult('13. ADMIN can create assignment', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 14: INSTRUCTOR can create assignment
    // ─────────────────────────────────────────────────────────────
    try {
        if (!instructorCookies) throw new Error('No instructor session');

        const res = await fetch(`${BASE_URL}/api/assignments`, {
            method: 'POST',
            headers: getHeaders(instructorCookies),
            body: JSON.stringify({
                title: `Instructor Assignment ${Date.now()}`,
                description: 'Test assignment from instructor',
            }),
        });

        if (res.status === 200 || res.status === 201) {
            logResult('14. INSTRUCTOR can create assignment', true, `status=${res.status}`);
        } else {
            logResult('14. INSTRUCTOR can create assignment', false, `status=${res.status}, expected 200/201`);
        }
    } catch (e: any) {
        logResult('14. INSTRUCTOR can create assignment', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 15: LEARNER denied assignment create
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');

        const res = await fetch(`${BASE_URL}/api/assignments`, {
            method: 'POST',
            headers: getHeaders(learnerCookies),
            body: JSON.stringify({
                title: `Learner Assignment ${Date.now()}`,
            }),
        });

        if (res.status === 403) {
            logResult('15. LEARNER denied assignment create', true, 'Correctly returns 403');
        } else {
            logResult('15. LEARNER denied assignment create', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('15. LEARNER denied assignment create', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 16: INSTRUCTOR can view submissions
    // ─────────────────────────────────────────────────────────────
    try {
        if (!instructorCookies) throw new Error('No instructor session');

        const res = await fetch(`${BASE_URL}/api/submissions`, {
            headers: getHeaders(instructorCookies),
        });

        if (res.status === 200) {
            logResult('16. INSTRUCTOR can view submissions', true, `status=${res.status}`);
        } else {
            logResult('16. INSTRUCTOR can view submissions', false, `status=${res.status}, expected 200`);
        }
    } catch (e: any) {
        logResult('16. INSTRUCTOR can view submissions', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 17: INSTRUCTOR can grade submission
    // ─────────────────────────────────────────────────────────────
    try {
        if (!instructorCookies) throw new Error('No instructor session');

        const res = await fetch(`${BASE_URL}/api/submissions`, {
            method: 'PATCH',
            headers: getHeaders(instructorCookies),
            body: JSON.stringify({
                id: '00000000-0000-0000-0000-000000000000',
                score: 85,
                status: 'GRADED'
            }),
        });

        // 404 means permission passed but ID doesn't exist
        if (res.status === 200 || res.status === 404) {
            logResult('17. INSTRUCTOR can grade submission', true, `status=${res.status}`);
        } else {
            logResult('17. INSTRUCTOR can grade submission', false, `status=${res.status}, expected 200/404`);
        }
    } catch (e: any) {
        logResult('17. INSTRUCTOR can grade submission', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 18: LEARNER denied grading
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');

        const res = await fetch(`${BASE_URL}/api/submissions`, {
            method: 'PATCH',
            headers: getHeaders(learnerCookies),
            body: JSON.stringify({
                id: 'some-id',
                score: 100
            }),
        });

        if (res.status === 403) {
            logResult('18. LEARNER denied grading', true, 'Correctly returns 403');
        } else {
            logResult('18. LEARNER denied grading', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('18. LEARNER denied grading', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 19: LEARNER can submit own submission
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');

        const res = await fetch(`${BASE_URL}/api/submissions`, {
            method: 'POST',
            headers: getHeaders(learnerCookies),
            body: JSON.stringify({
                assignmentId: 'fake-id',
                content: 'Test submission'
            }),
        });

        // 404 means permission passed (but assignment not found)
        // 400 might happen if assignment exists but logic fails, but for RBAC 404/201 is good
        if (res.status === 201 || res.status === 404 || res.status === 400) {
            // Note: 400 is also acceptable if assignment actually exists but validation fails, 
            // but for a fake ID 404 is the best indicator of "passed permission check"
            logResult('19. LEARNER can submit (passed permission)', true, `status=${res.status}`);
        } else {
            logResult('19. LEARNER can submit (passed permission)', false, `status=${res.status}, expected 201/404/400`);
        }
    } catch (e: any) {
        logResult('19. LEARNER can submit (passed permission)', false, e.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // REMAINING MODULES (Reports, Calendar, Conference, Skills)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📅 Remaining Modules Tests\n');

    // ─────────────────────────────────────────────────────────────
    // Test 20: ADMIN can read reports
    // ─────────────────────────────────────────────────────────────
    try {
        if (!adminCookies) throw new Error('No admin session');
        const res = await fetch(`${BASE_URL}/api/reports`, {
            headers: getHeaders(adminCookies),
        });
        if (res.status === 200) {
            logResult('20. ADMIN can read reports', true, `status=${res.status}`);
        } else {
            const body = await res.json().catch(() => ({}));
            logResult('20. ADMIN can read reports', false, `status=${res.status}, error=${body.error || 'unknown'}`);
        }
    } catch (e: any) {
        logResult('20. ADMIN can read reports', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 21: LEARNER denied reports
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');
        const res = await fetch(`${BASE_URL}/api/reports`, {
            headers: getHeaders(learnerCookies),
        });
        if (res.status === 403) {
            logResult('21. LEARNER denied reports', true, 'Correctly returns 403');
        } else {
            logResult('21. LEARNER denied reports', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('21. LEARNER denied reports', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 22: ADMIN can create calendar event
    // ─────────────────────────────────────────────────────────────
    try {
        if (!adminCookies) throw new Error('No admin session');
        const res = await fetch(`${BASE_URL}/api/calendar-events`, {
            method: 'POST',
            headers: getHeaders(adminCookies),
            body: JSON.stringify({
                title: 'Admin Event',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                type: 'custom'
            }),
        });
        if (res.status === 200 || res.status === 201) {
            logResult('22. ADMIN can create calendar event', true, `status=${res.status}`);
        } else {
            const body = await res.json().catch(() => ({}));
            logResult('22. ADMIN can create calendar event', false, `status=${res.status}, error=${body.error || 'unknown'}`);
        }
    } catch (e: any) {
        logResult('22. ADMIN can create calendar event', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 23: LEARNER denied calendar create
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');
        const res = await fetch(`${BASE_URL}/api/calendar-events`, {
            method: 'POST',
            headers: getHeaders(learnerCookies),
            body: JSON.stringify({ title: 'Learner Event' }),
        });
        if (res.status === 403) {
            logResult('23. LEARNER denied calendar create', true, 'Correctly returns 403');
        } else {
            logResult('23. LEARNER denied calendar create', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('23. LEARNER denied calendar create', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 24: ADMIN can create conference
    // ─────────────────────────────────────────────────────────────
    try {
        if (!adminCookies) throw new Error('No admin session');
        const res = await fetch(`${BASE_URL}/api/conferences`, {
            method: 'POST',
            headers: getHeaders(adminCookies),
            body: JSON.stringify({
                title: 'Admin Conference',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
            }),
        });
        if (res.status === 200 || res.status === 201) {
            logResult('24. ADMIN can create conference', true, `status=${res.status}`);
        } else {
            const body = await res.json().catch(() => ({}));
            logResult('24. ADMIN can create conference', false, `status=${res.status}, error=${body.error || 'unknown'}`);
        }
    } catch (e: any) {
        logResult('24. ADMIN can create conference', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 25: LEARNER denied conference create
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');
        const res = await fetch(`${BASE_URL}/api/conferences`, {
            method: 'POST',
            headers: getHeaders(learnerCookies),
            body: JSON.stringify({ title: 'Learner Conf' }),
        });
        if (res.status === 403) {
            logResult('25. LEARNER denied conference create', true, 'Correctly returns 403');
        } else {
            logResult('25. LEARNER denied conference create', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('25. LEARNER denied conference create', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 26: ADMIN can create skill
    // ─────────────────────────────────────────────────────────────
    try {
        if (!adminCookies) throw new Error('No admin session');
        const res = await fetch(`${BASE_URL}/api/skills`, {
            method: 'POST',
            headers: getHeaders(adminCookies),
            body: JSON.stringify({
                name: 'Admin Skill',
                description: 'Test skill'
            }),
        });
        if (res.status === 200 || res.status === 201) {
            logResult('26. ADMIN can create skill', true, `status=${res.status}`);
        } else {
            const body = await res.json().catch(() => ({}));
            logResult('26. ADMIN can create skill', false, `status=${res.status}, error=${body.error || 'unknown'}`);
        }
    } catch (e: any) {
        logResult('26. ADMIN can create skill', false, e.message);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 27: LEARNER denied skill create
    // ─────────────────────────────────────────────────────────────
    try {
        if (!learnerCookies) throw new Error('No learner session');
        const res = await fetch(`${BASE_URL}/api/skills`, {
            method: 'POST',
            headers: getHeaders(learnerCookies),
            body: JSON.stringify({ name: 'Learner Skill' }),
        });
        if (res.status === 403) {
            logResult('27. LEARNER denied skill create', true, 'Correctly returns 403');
        } else {
            logResult('27. LEARNER denied skill create', false, `status=${res.status}, expected 403`);
        }
    } catch (e: any) {
        logResult('27. LEARNER denied skill create', false, e.message);
    }

    printSummary();
}

function printSummary() {
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 SUMMARY\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log('┌─────────────────────────────────────────────────┬────────┐');
    console.log('│ Test                                            │ Status │');
    console.log('├─────────────────────────────────────────────────┼────────┤');

    for (const r of results) {
        const name = r.name.padEnd(47);
        const status = r.passed ? ' PASS ' : ' FAIL ';
        console.log(`│ ${name} │${status}│`);
    }

    console.log('└─────────────────────────────────────────────────┴────────┘');
    console.log(`\nTotal: ${passed}/${total} passed`);

    if (failed > 0) {
        console.log('\n❌ SOME TESTS FAILED\n');
        process.exit(1);
    } else {
        console.log('\n✅ ALL TESTS PASSED\n');
        process.exit(0);
    }
}

// Run tests
runTests().catch(console.error);
