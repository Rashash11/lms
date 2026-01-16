// tests/integration/api/tenantIsolation.test.ts
// Integration tests for tenant isolation using direct handler invocation (mocked network).

import { describe, test, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthClient } from '../../integration/helpers/api-client';
import { GET, PUT } from '@/app/api/courses/[id]/route';

// Define Test Data IDs
const TEST_TENANT_A_ID = 'tenant-isol-a-0000-0000-0000-00000000';
const TEST_TENANT_B_ID = 'tenant-isol-b-0000-0000-0000-00000000';
const TEST_USER_A_ID = 'user-isol-a-0000-0000-0000-00000000';
const TEST_COURSE_B_ID = 'course-isol-b-0000-0000-0000-00000000';

// Random non-existent UUID
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000999';

describe('Tenant Isolation', () => {
    beforeAll(async () => {
        // Seed Tenant A
        await prisma.tenant.upsert({
            where: { id: TEST_TENANT_A_ID },
            update: {},
            create: {
                id: TEST_TENANT_A_ID,
                name: 'Tenant Isolation A',
                domain: 'tenant-isol-a.test',
                settings: {}
            }
        });

        // Seed Tenant B
        await prisma.tenant.upsert({
            where: { id: TEST_TENANT_B_ID },
            update: {},
            create: {
                id: TEST_TENANT_B_ID,
                name: 'Tenant Isolation B',
                domain: 'tenant-isol-b.test',
                settings: {}
            }
        });

        // Seed User A (Admin in Tenant A)
        await prisma.user.upsert({
            where: { id: TEST_USER_A_ID },
            update: { tenantId: TEST_TENANT_A_ID },
            create: {
                id: TEST_USER_A_ID,
                email: 'admin@tenant-isol-a.test',
                username: 'admin_isol_a',
                firstName: 'Admin',
                lastName: 'A',
                role: 'ADMIN',
                status: 'ACTIVE',
                tenantId: TEST_TENANT_A_ID
            }
        });

        // Seed User A Roles
        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: TEST_TENANT_A_ID, userId: TEST_USER_A_ID, roleKey: 'ADMIN' } },
            update: {},
            create: { tenantId: TEST_TENANT_A_ID, userId: TEST_USER_A_ID, roleKey: 'ADMIN' }
        });

        // Seed Course in Tenant B
        await prisma.course.upsert({
            where: { id: TEST_COURSE_B_ID },
            update: { tenantId: TEST_TENANT_B_ID },
            create: {
                id: TEST_COURSE_B_ID,
                code: 'COURSE-ISOL-B',
                title: 'Secret Course B',
                description: 'Should not be visible to A',
                status: 'PUBLISHED',
                tenantId: TEST_TENANT_B_ID,
                isActive: true
            }
        });
    });

    test('Tenant A cannot read resource from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TEST_TENANT_A_ID, TEST_USER_A_ID);

        const response = await client.fetch(GET, `/api/courses/${TEST_COURSE_B_ID}`, {
            params: { id: TEST_COURSE_B_ID }
        });

        expect(response.status).toBe(404);
    });

    test('Tenant A cannot read non-existent resource (404)', async () => {
        const client = await getAuthClient('ADMIN', TEST_TENANT_A_ID, TEST_USER_A_ID);

        const response = await client.fetch(GET, `/api/courses/${NON_EXISTENT_UUID}`, {
            params: { id: NON_EXISTENT_UUID }
        });

        expect(response.status).toBe(404);
    });

    test('Tenant A cannot update resource from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TEST_TENANT_A_ID, TEST_USER_A_ID);

        const response = await client.fetch(PUT, `/api/courses/${TEST_COURSE_B_ID}`, {
            method: 'PUT',
            params: { id: TEST_COURSE_B_ID },
            body: { title: 'Hacked Title' }
        });

        expect(response.status).toBe(404);
    });
});
