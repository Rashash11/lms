import { describe, test, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthClient } from '../helpers/api-client';
import { GET as getCourse, PUT as updateCourse } from '@/app/api/courses/[id]/route';
import { GET as getUser } from '@/app/api/users/[id]/route';

// Define Test Data IDs
const TENANT_A = 'tenant-isol-sec-a';
const TENANT_B = 'tenant-isol-sec-b';
const USER_A_ADMIN = 'user-isol-sec-a-admin';
const USER_B_ADMIN = 'user-isol-sec-b-admin';
const COURSE_B = 'course-isol-sec-b';
const USER_B_TARGET = 'user-isol-sec-b-target';

describe('Security: Tenant Isolation', () => {
    beforeAll(async () => {
        // Setup Tenants
        await prisma.tenant.upsert({ where: { id: TENANT_A }, update: {}, create: { id: TENANT_A, name: 'Tenant A', domain: 'sec-a.test', settings: {} } });
        await prisma.tenant.upsert({ where: { id: TENANT_B }, update: {}, create: { id: TENANT_B, name: 'Tenant B', domain: 'sec-b.test', settings: {} } });

        // Setup Users
        await prisma.user.upsert({ where: { id: USER_A_ADMIN }, update: {}, create: { id: USER_A_ADMIN, tenantId: TENANT_A, email: 'admin@sec-a.test', username: 'admin_sec_a', firstName: 'A', lastName: 'Admin', activeRole: 'ADMIN', status: 'ACTIVE' } });
        await prisma.user.upsert({ where: { id: USER_B_ADMIN }, update: {}, create: { id: USER_B_ADMIN, tenantId: TENANT_B, email: 'admin@sec-b.test', username: 'admin_sec_b', firstName: 'B', lastName: 'Admin', activeRole: 'ADMIN', status: 'ACTIVE' } });
        await prisma.user.upsert({ where: { id: USER_B_TARGET }, update: {}, create: { id: USER_B_TARGET, tenantId: TENANT_B, email: 'target@sec-b.test', username: 'target_sec_b', firstName: 'B', lastName: 'Target', activeRole: 'LEARNER', status: 'ACTIVE' } });

        // Setup Course in Tenant B
        await prisma.course.upsert({
            where: { id: COURSE_B },
            update: {},
            create: { id: COURSE_B, tenantId: TENANT_B, code: 'SEC-B-101', title: 'Secret B Course', status: 'PUBLISHED' }
        });
    });

    test('Admin A cannot READ Course from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TENANT_A, USER_A_ADMIN);
        const res = await client.fetch(getCourse, `/api/courses/${COURSE_B}`, { params: { id: COURSE_B } });
        expect(res.status).toBe(404);
    });

    test('Admin A cannot UPDATE Course from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TENANT_A, USER_A_ADMIN);
        const res = await client.fetch(updateCourse, `/api/courses/${COURSE_B}`, { 
            method: 'PUT',
            params: { id: COURSE_B },
            body: { title: 'Hacked' }
        });
        expect(res.status).toBe(404);
    });

    test('Admin A cannot READ User from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TENANT_A, USER_A_ADMIN);
        const res = await client.fetch(getUser, `/api/users/${USER_B_TARGET}`, { params: { id: USER_B_TARGET } });
        expect(res.status).toBe(404);
    });
});
