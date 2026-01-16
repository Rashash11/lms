import { describe, test, expect, vi, beforeAll } from 'vitest';
import { getAuthClient } from '../helpers/api-client';
import { POST } from '@/app/api/reports/export/training-matrix/route';
import { jobs } from '@/lib/jobs/queues';
import { prisma } from '@/lib/prisma';

// Mock the queueing system to avoid Redis requirement
vi.mock('@/lib/jobs/queues', async () => {
    const actual = await vi.importActual<typeof import('@/lib/jobs/queues')>('@/lib/jobs/queues');
    return {
        ...actual,
        jobs: {
            ...actual.jobs,
            report: {
                ...actual.jobs.report,
                export: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
            }
        }
    };
});

describe('Export Jobs (BullMQ)', () => {
    beforeAll(async () => {
        // Seed user for auth check
        await prisma.tenant.upsert({
            where: { id: 'default-tenant-id' },
            update: {},
            create: { id: 'default-tenant-id', name: 'Default', domain: 'default.test', settings: {} }
        });

        await prisma.user.upsert({
            where: { id: 'admin-user-id' },
            update: { tenantId: 'default-tenant-id' },
            create: {
                id: 'admin-user-id',
                email: 'admin@export.test',
                username: 'admin_export',
                firstName: 'Admin',
                lastName: 'Export',
                activeRole: 'ADMIN',
                status: 'ACTIVE',
                tenantId: 'default-tenant-id'
            }
        });
        
        // Ensure user has role in DB (if needed by guard)
        // Guard checks activeRole column, which we set.
    });

    test('Training Matrix export should be queued (Async)', async () => {
        const client = await getAuthClient('ADMIN', 'default-tenant-id', 'admin-user-id');
        
        // Call the endpoint
        const res = await client.fetch(POST, '/api/reports/export/training-matrix', {
            method: 'POST',
            body: { search: '', branchId: null, groupId: null }
        });

        // Expect 202 Accepted (indicating async processing)
        expect(res.status).toBe(202);
        
        // Expect the job to have been added to the queue
        expect(jobs.report.export).toHaveBeenCalled();
        
        // Verify payload
        const callArgs = vi.mocked(jobs.report.export).mock.calls[0][0];
        expect(callArgs).toMatchObject({
            reportId: 'training-matrix',
            format: 'xlsx',
            tenantId: 'default-tenant-id',
            userId: 'admin-user-id'
        });
    });
});
