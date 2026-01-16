import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateBody, userSchemas, ValidationError } from '@/lib/validations';
import { jobs } from '@/lib/jobs';
import { join } from 'path';

/**
 * POST /api/admin/users/import
 * Trigger a bulk user import job
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'user:create', // Import is a creation task
        auditEvent: 'USER_IMPORT_START',
    }, async (ctx: GuardedContext) => {
        let body;
        try {
            body = await validateBody(request, userSchemas.import);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { fileId, options } = body;

        // 1. Verify file exists in DB
        const asset = await prisma.unitAsset.findUnique({
            where: { id: fileId }
        });

        if (!asset) {
            return apiError('File not found', 404);
        }

        // 2. Create ImportJob record
        const importJob = await prisma.importJob.create({
            data: {
                tenantId: ctx.session.tenantId,
                userId: ctx.session.userId,
                type: 'USERS',
                status: 'PENDING',
                metadata: {
                    fileId,
                    fileName: asset.name,
                    options: options || {}
                }
            }
        });

        // 3. Construct file path
        // Assumptions: files are relative to process.cwd() or in public/uploads
        let filePath = '';
        if (asset.url.startsWith('/files/')) {
            // Course asset: /files/[courseId]/[unitId]/[filename]
            const parts = asset.url.split('/');
            const courseId = parts[2];
            const unitId = parts[3];
            const fileName = parts[4];
            filePath = join(process.cwd(), 'public', 'uploads', courseId, unitId, fileName);
        } else if (asset.url.startsWith('/uploads/assignments/')) {
            const fileName = asset.url.split('/').pop()!;
            filePath = join(process.cwd(), 'public', 'uploads', 'assignments', fileName);
        } else {
            return apiError('Unsupported file storage location', 400);
        }

        // 4. Queue the job
        const tenantId = ctx.session.tenantId;
        if (!tenantId) return apiError('Missing tenant context', 400);
        await jobs.import.users({
            importJobId: importJob.id,
            filePath,
            tenantId,
            userId: ctx.session.userId,
            options: options || {}
        });

        return apiResponse({
            success: true,
            jobId: importJob.id,
            message: 'Import job queued successfully'
        }, 202);
    });
}

/**
 * GET /api/admin/users/import
 * List recent import jobs
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'user:read',
    }, async (ctx: GuardedContext) => {
        const tenantId = ctx.session.tenantId;
        if (!tenantId) return apiError('Missing tenant context', 400);
        const jobs_list = await prisma.importJob.findMany({
            where: { tenantId, type: 'USERS' },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return apiResponse({ data: jobs_list });
    });
}
