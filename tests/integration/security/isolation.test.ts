import { describe, it, expect, beforeAll } from 'vitest';
import { getAuthClient } from '../helpers/api-client';
import { GET as getCoursesHandler } from '@/app/api/courses/route';
import { prisma } from '@/lib/prisma';

// Use valid-looking UUIDs
const TEST_TENANT_A = '11111111-1111-1111-1111-111111111111';
const TEST_TENANT_B = '22222222-2222-2222-2222-222222222222';
const TEST_USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TEST_USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('Multi-Tenancy Isolation', () => {
    beforeAll(async () => {
        // Ensure tenants exist
        await prisma.tenant.upsert({
            where: { id: TEST_TENANT_A },
            update: {},
            create: {
                id: TEST_TENANT_A,
                name: 'Tenant A',
                domain: 'tenant-a.test',
                settings: {}
            }
        });
        await prisma.tenant.upsert({
            where: { id: TEST_TENANT_B },
            update: {},
            create: {
                id: TEST_TENANT_B,
                name: 'Tenant B',
                domain: 'tenant-b.test',
                settings: {}
            }
        });

        // Ensure users exist
        await prisma.user.upsert({
            where: { id: TEST_USER_A },
            update: { tenantId: TEST_TENANT_A },
            create: {
                id: TEST_USER_A,
                email: 'user@a.test',
                username: 'user_a',
                tenantId: TEST_TENANT_A,
                role: 'LEARNER',
                firstName: 'User',
                lastName: 'A'
            }
        });
        await prisma.user.upsert({
            where: { id: TEST_USER_B },
            update: { tenantId: TEST_TENANT_B },
            create: {
                id: TEST_USER_B,
                email: 'user@b.test',
                username: 'user_b',
                tenantId: TEST_TENANT_B,
                role: 'ADMIN',
                firstName: 'User',
                lastName: 'B'
            }
        });

        // Create some courses
        await prisma.course.upsert({
            where: { tenantId_code: { tenantId: TEST_TENANT_A, code: 'COURSE-A' } },
            update: { title: 'Course A' },
            create: {
                code: 'COURSE-A',
                title: 'Course A',
                tenantId: TEST_TENANT_A,
                instructorId: TEST_USER_A,
                status: 'PUBLISHED'
            }
        });
        await prisma.course.upsert({
            where: { tenantId_code: { tenantId: TEST_TENANT_B, code: 'COURSE-B' } },
            update: { title: 'Course B' },
            create: {
                code: 'COURSE-B',
                title: 'Course B',
                tenantId: TEST_TENANT_B,
                instructorId: TEST_USER_B,
                status: 'PUBLISHED'
            }
        });
    });

    it('should prevent Tenant B Learner from seeing Tenant A Courses', async () => {
        const tenantBClient = await getAuthClient('LEARNER', TEST_TENANT_B, TEST_USER_B);

        const response = await tenantBClient.fetch(
            getCoursesHandler,
            '/api/courses'
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        const courses = data.data || data.courses || []; // Handle both formats

        // Every course returned must belong to tenant-b
        courses.forEach((course: any) => {
            expect(course.tenantId).toBe(TEST_TENANT_B);
            expect(course.tenantId).not.toBe(TEST_TENANT_A);
        });
    });

    it('should not contain other tenant s resources in search results', async () => {
        const tenantBAdmin = await getAuthClient('ADMIN', TEST_TENANT_B, TEST_USER_B);

        const response = await tenantBAdmin.fetch(
            getCoursesHandler,
            '/api/courses?search=Course A'
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        const courses = data.data || data.courses || [];

        const foundCourseA = courses.find((c: any) => c.title === 'Course A');
        expect(foundCourseA).toBeUndefined();
    });
});
