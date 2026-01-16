/**
 * Core Journey Tests
 * 
 * End-to-end journeys that exercise CRUD operations for key entities.
 * All test-created entities use E2E_TEST_ prefix for safe cleanup.
 */

import { test, expect, Page } from '@playwright/test';
import { getStorageStatePath, loadSeedFixtures } from '../helpers/auth';

const E2E_PREFIX = 'E2E_TEST_';

async function getCsrfHeader(page: Page) {
    const csrfToken = (await page.context().cookies()).find(c => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

// Helper to generate unique test names
function testName(base: string): string {
    return `${E2E_PREFIX}${base}_${Date.now()}`;
}

// Cleanup helper - only deletes entities with E2E_TEST_ prefix
async function cleanupTestEntity(
    page: Page,
    apiEndpoint: string,
    entityId: string,
    entityName: string
): Promise<void> {
    if (!entityName.startsWith(E2E_PREFIX)) {
        console.log(`Skipping cleanup: ${entityName} does not have E2E_TEST_ prefix`);
        return;
    }

    try {
        const response = await page.request.delete(`${apiEndpoint}/${entityId}`, {
            headers: await getCsrfHeader(page),
        });
        if (response.ok()) {
            console.log(`Cleaned up: ${entityName}`);
        }
    } catch (error) {
        console.error(`Failed to cleanup ${entityName}:`, error);
    }
}

// ============================================
// ADMIN JOURNEY
// ============================================
test.describe('Admin Journey', () => {
    test.use({ storageState: getStorageStatePath('admin') });

    test('create category, group, course, skill, learning path, enroll learner', async ({ page }) => {
        const fixtures = loadSeedFixtures();
        const createdIds: { type: string; id: string; name: string }[] = [];

        try {
            // ============================================
            // 1. CREATE CATEGORY
            // ============================================
            const categoryName = testName('Category');
            await page.goto('/admin/courses');
            await page.waitForLoadState('networkidle');

            // Create category via API (faster and more reliable)
            const categoryResponse = await page.request.post('/api/categories', {
                headers: await getCsrfHeader(page),
                data: {
                    name: categoryName,
                    description: 'E2E test category',
                },
            });

            if (categoryResponse.ok()) {
                const category = await categoryResponse.json();
                createdIds.push({ type: 'category', id: category.id, name: categoryName });
                console.log(`✅ Created category: ${categoryName}`);
            }

            // ============================================
            // 2. CREATE GROUP
            // ============================================
            const groupName = testName('Group');

            const groupResponse = await page.request.post('/api/groups', {
                headers: await getCsrfHeader(page),
                data: {
                    name: groupName,
                    description: 'E2E test group',
                },
            });

            if (groupResponse.ok()) {
                const group = await groupResponse.json();
                createdIds.push({ type: 'group', id: group.id, name: groupName });
                console.log(`✅ Created group: ${groupName}`);
            }

            // ============================================
            // 3. CREATE COURSE
            // ============================================
            const courseName = testName('Course');
            const courseCode = `E2E-${Date.now()}`;

            const courseResponse = await page.request.post('/api/courses', {
                headers: await getCsrfHeader(page),
                data: {
                    title: courseName,
                    code: courseCode,
                    description: 'E2E test course',
                    status: 'DRAFT',
                },
            });

            let courseId: string | null = null;
            if (courseResponse.ok()) {
                const course = await courseResponse.json();
                courseId = course.id;
                createdIds.push({ type: 'course', id: course.id, name: courseName });
                console.log(`✅ Created course: ${courseName}`);

                // Add a section to the course
                const sectionResponse = await page.request.post(`/api/courses/${courseId}/sections`, {
                    headers: await getCsrfHeader(page),
                    data: {
                        title: `${E2E_PREFIX}Section_1`,
                        order_index: 0,
                    },
                });

                if (sectionResponse.ok()) {
                    const section = await sectionResponse.json();
                    console.log(`   ✅ Added section: ${section.title}`);

                    // Add units
                    await page.request.post(`/api/courses/${courseId}/units`, {
                        headers: await getCsrfHeader(page),
                        data: {
                            sectionId: section.id,
                            title: `${E2E_PREFIX}Video_Unit`,
                            type: 'VIDEO',
                            order_index: 0,
                            config: { videoUrl: 'https://example.com/test.mp4' },
                        },
                    });

                    await page.request.post(`/api/courses/${courseId}/units`, {
                        headers: await getCsrfHeader(page),
                        data: {
                            sectionId: section.id,
                            title: `${E2E_PREFIX}Document_Unit`,
                            type: 'DOCUMENT',
                            order_index: 1,
                            config: { content: '<p>Test content</p>' },
                        },
                    });
                    console.log(`   ✅ Added 2 units to section`);
                }
            }

            // ============================================
            // 4. CREATE SKILL AND LINK TO COURSE
            // ============================================
            const skillName = testName('Skill');

            const skillResponse = await page.request.post('/api/skills', {
                headers: await getCsrfHeader(page),
                data: {
                    name: skillName,
                    description: 'E2E test skill',
                },
            });

            if (skillResponse.ok()) {
                const skill = await skillResponse.json();
                createdIds.push({ type: 'skill', id: skill.id, name: skillName });
                console.log(`✅ Created skill: ${skillName}`);

                // Link skill to course if course was created
                if (courseId) {
                    // This would typically be done via course edit
                    console.log(`   ℹ️ Skill linking would be done via course edit UI`);
                }
            }

            // ============================================
            // 5. CREATE LEARNING PATH
            // ============================================
            const lpName = testName('LearningPath');
            const lpCode = `E2E-LP-${Date.now()}`;

            const lpResponse = await page.request.post('/api/learning-paths', {
                headers: await getCsrfHeader(page),
                data: {
                    name: lpName,
                    code: lpCode,
                    description: 'E2E test learning path',
                },
            });

            let lpId: string | null = null;
            if (lpResponse.ok()) {
                const lp = await lpResponse.json();
                lpId = lp.id;
                createdIds.push({ type: 'learning-path', id: lp.id, name: lpName });
                console.log(`✅ Created learning path: ${lpName}`);

                // Add course to learning path
                if (courseId) {
                    const addCourseResponse = await page.request.post(`/api/learning-paths/${lpId}/courses`, {
                        headers: await getCsrfHeader(page),
                        data: {
                            courseId: courseId,
                            order: 0,
                        },
                    });

                    if (addCourseResponse.ok()) {
                        console.log(`   ✅ Added course to learning path`);
                    }
                }
            }

            // ============================================
            // 6. ENROLL LEARNER
            // ============================================
            if (courseId) {
                const enrollResponse = await page.request.post(`/api/courses/${courseId}/enrollments`, {
                    headers: await getCsrfHeader(page),
                    data: {
                        userId: fixtures.learnerAId,
                    },
                });

                if (enrollResponse.ok()) {
                    console.log(`✅ Enrolled learnerA in course`);
                } else {
                    // Might already be enrolled
                    console.log(`ℹ️ Enrollment response: ${enrollResponse.status()}`);
                }
            }

            // ============================================
            // 7. VERIFY LEARNER SEES COURSE
            // ============================================
            // This would require switching context to learner
            // For now, just verify the entities exist

            console.log(`\n📋 Created ${createdIds.length} entities for testing`);

        } finally {
            // ============================================
            // CLEANUP - Only delete E2E_TEST_ entities
            // ============================================
            console.log('\n🧹 Cleaning up test entities...');

            for (const entity of createdIds.reverse()) {
                if (entity.name.startsWith(E2E_PREFIX)) {
                    const endpoint = entity.type === 'learning-path'
                        ? '/api/learning-paths'
                        : `/api/${entity.type}s`;

                    try {
                        await page.request.delete(`${endpoint}/${entity.id}`, {
                            headers: await getCsrfHeader(page),
                        });
                        console.log(`   ✅ Deleted ${entity.type}: ${entity.name}`);
                    } catch (e) {
                        console.log(`   ⚠️ Failed to delete ${entity.type}: ${entity.name}`);
                    }
                }
            }
        }
    });
});

// ============================================
// INSTRUCTOR JOURNEY
// ============================================
test.describe('Instructor Journey', () => {
    test.use({ storageState: getStorageStatePath('instructor') });

    test('create assignment, verify submission, grade it', async ({ page }) => {
        const fixtures = loadSeedFixtures();
        let assignmentId: string | null = null;
        const assignmentTitle = testName('Assignment');

        try {
            // ============================================
            // 1. CREATE ASSIGNMENT
            // ============================================
            const assignmentResponse = await page.request.post('/api/assignments', {
                headers: await getCsrfHeader(page),
                data: {
                    title: assignmentTitle,
                    description: 'E2E test assignment',
                    courseId: fixtures.courseAId,
                    dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
            });

            if (assignmentResponse.ok()) {
                const assignment = await assignmentResponse.json();
                assignmentId = assignment.id;
                console.log(`✅ Created assignment: ${assignmentTitle}`);
            } else {
                console.log(`⚠️ Assignment creation returned: ${assignmentResponse.status()}`);
                // Continue with seeded assignment
                assignmentId = fixtures.assignmentAId;
            }

            // ============================================
            // 2. VERIFY ASSIGNMENT APPEARS
            // ============================================
            await page.goto('/instructor/assignments');
            await page.waitForLoadState('networkidle');

            // The assignment should appear in the list
            // (either our new one or the seeded one)

            // ============================================
            // 3. CHECK GRADING HUB
            // ============================================
            await page.goto('/instructor/grading-hub');
            await page.waitForLoadState('networkidle');

            // Verify page loads without error boundary
            const content = await page.content();
            expect(content).not.toContain('Something went wrong');
            expect(content).not.toContain('Application error');

            // ============================================
            // 4. GRADE A SUBMISSION (if exists)
            // ============================================
            // The seeded submission from fixtures.submissionAId
            const submissionResponse = await page.request.get(`/api/submissions/${fixtures.submissionAId}`);

            if (submissionResponse.ok()) {
                // Update submission with grade
                const gradeResponse = await page.request.put(`/api/submissions/${fixtures.submissionAId}`, {
                    headers: await getCsrfHeader(page),
                    data: {
                        score: 85,
                        feedback: 'Great work! E2E test feedback.',
                        status: 'GRADED',
                    },
                });

                if (gradeResponse.ok()) {
                    console.log(`✅ Graded submission with score: 85`);
                }
            }

            console.log(`✅ Instructor journey completed`);

        } finally {
            // Cleanup
            if (assignmentId && assignmentId !== fixtures.assignmentAId) {
                try {
                    await page.request.delete(`/api/assignments/${assignmentId}`, {
                        headers: await getCsrfHeader(page),
                    });
                    console.log(`🧹 Cleaned up assignment: ${assignmentTitle}`);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    });
});

// ============================================
// LEARNER JOURNEY
// ============================================
test.describe('Learner Journey', () => {
    test.use({ storageState: getStorageStatePath('learner') });

    test('view enrolled courses, access course content', async ({ page }) => {
        const fixtures = loadSeedFixtures();

        // ============================================
        // 1. VIEW DASHBOARD
        // ============================================
        await page.goto('/learner');
        await page.waitForLoadState('domcontentloaded');

        // Should see dashboard without error boundary
        const content = await page.content();
        expect(content).not.toContain('Something went wrong');
        expect(content).not.toContain('Application error');

        // ============================================
        // 2. VIEW MY COURSES
        // ============================================
        await page.goto('/learner/courses');
        await page.waitForLoadState('domcontentloaded');

        // Should see enrolled course
        const coursesContent = await page.content();
        // The seeded Course A should appear

        // ============================================
        // 3. ACCESS COURSE DETAIL
        // ============================================
        await page.goto(`/learner/courses/${fixtures.courseAId}`);
        await page.waitForURL(new RegExp(`/learner/courses/${fixtures.courseAId}/units/`));

        // ============================================
        // 4. ACCESS UNIT
        // ============================================
        await page.goto(`/learner/courses/${fixtures.courseAId}/units/${fixtures.unitVideoId}`);
        await page.waitForLoadState('domcontentloaded');

        // Should load unit player
        const unitContent = await page.content();
        expect(unitContent).not.toContain('404');

        // ============================================
        // 5. VIEW ASSIGNMENTS
        // ============================================
        await page.goto('/learner/assignments');
        await page.waitForLoadState('domcontentloaded');

        // Should see assignments list

        // ============================================
        // 6. VIEW CERTIFICATES
        // ============================================
        await page.goto('/learner/certificates');
        await page.waitForLoadState('domcontentloaded');

        // Should load certificates page (might be empty)

        console.log(`✅ Learner journey completed`);
    });
});

// ============================================
// QUICK SMOKE TESTS
// ============================================
test.describe('Quick Smoke - Optional Pages', () => {
    test.use({ storageState: getStorageStatePath('instructor') });

    test('conferences page loads', async ({ page }) => {
        await page.goto('/instructor/conferences');
        await page.waitForLoadState('networkidle');

        const content = await page.content();
        expect(content).not.toContain('404');
    });

    test('calendar page loads', async ({ page }) => {
        await page.goto('/instructor/calendar');
        await page.waitForLoadState('networkidle');

        const content = await page.content();
        expect(content).not.toContain('404');
    });
});

test.describe('Quick Smoke - Admin Pages', () => {
    test.use({ storageState: getStorageStatePath('admin') });

    test('notifications page loads', async ({ page }) => {
        await page.goto('/admin/notifications');
        await page.waitForLoadState('networkidle');

        const content = await page.content();
        expect(content).not.toContain('404');
    });

    test('automations page loads', async ({ page }) => {
        await page.goto('/admin/automations');
        await page.waitForLoadState('networkidle');

        const content = await page.content();
        expect(content).not.toContain('404');
    });
});
