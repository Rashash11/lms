import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateBody, branchSchemas, ValidationError } from '@/lib/validations';

/**
 * GET /api/branches/[id]
 * Get branch details
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {
        permission: 'branches:read',
    }, async (ctx: GuardedContext) => {
        const branch = await prisma.branch.findUnique({
            where: { id: params.id },
            include: {
                tenant: {
                    select: { name: true, domain: true }
                }
            },
        });

        if (!branch) {
            return apiError('Branch not found', 404);
        }

        return apiResponse(branch);
    });
}

/**
 * PATCH /api/branches/[id]
 * Update branch settings
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'branches:update',
        auditEvent: 'BRANCH_UPDATE',
    }, async (ctx: GuardedContext) => {
        let body;
        try {
            // Using a more flexible schema for updates
            body = await validateBody(request, branchSchemas.create.partial());
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // Check exists
        const branch = await prisma.branch.findUnique({
            where: { id: params.id }
        });

        if (!branch) {
            return apiError('Branch not found', 404);
        }

        // Check slug uniqueness
        if (body.slug && body.slug !== branch.slug) {
            const existing = await prisma.branch.findFirst({
                where: {
                    tenantId: ctx.session.tenantId,
                    slug: body.slug,
                    id: { not: params.id }
                }
            });
            if (existing) {
                return apiError('Branch with this slug already exists', 400);
            }
        }

        const updated = await prisma.branch.update({
            where: { id: params.id },
            data: body
        });

        return apiResponse(updated);
    });
}

/**
 * DELETE /api/branches/[id]
 * Delete branch
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'branches:delete',
        auditEvent: 'BRANCH_DELETE',
    }, async (ctx: GuardedContext) => {
        // Prevent deleting last branch? 
        const count = await prisma.branch.count({
            where: { tenantId: ctx.session.tenantId }
        });

        if (count <= 1) {
            return apiError('Cannot delete the primary branch', 400);
        }

        await prisma.branch.delete({
            where: { id: params.id }
        });

        return apiResponse({ success: true });
    });
}
