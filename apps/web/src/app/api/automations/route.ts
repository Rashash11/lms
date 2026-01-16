import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import {
    validateBody,
    validateQuery,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    type: z.enum(['assign_course', 'send_notification', 'deactivate_user', 'webhook', 'assign_badge']).optional(),
    enabled: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});

// Create schema
const createAutomationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['assign_course', 'send_notification', 'deactivate_user', 'webhook', 'assign_badge']),
    parameters: z.record(z.any()),
    filters: z.record(z.any()).optional(),
    enabled: z.boolean().optional(),
});

/**
 * GET /api/automations
 * List automations
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'automations:read',
        roles: ['ADMIN'],
    }, async (ctx: GuardedContext) => {
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, listQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { search, type, enabled, page, limit } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (type) {
            where.type = type;
        }
        if (enabled !== undefined) {
            where.enabled = enabled;
        }

        const [automations, total] = await Promise.all([
            prisma.automation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.automation.count({ where }),
        ]);

        // Get run counts
        const automationIds = automations.map((a: any) => a.id);
        const logCounts = await prisma.automationLog.groupBy({
            by: ['automationId'],
            where: { automationId: { in: automationIds } },
            _count: { id: true },
        });

        const countMap = new Map(logCounts.map((l: any) => [l.automationId, l._count.id]));

        const automationsWithCounts = automations.map((a: any) => ({
            ...a,
            runCount: countMap.get(a.id) || 0,
        }));

        return apiResponse({
            data: automationsWithCounts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    });
}

/**
 * POST /api/automations
 * Create automation
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'automations:create',
        roles: ['ADMIN'],
        auditEvent: 'AUTOMATION_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, createAutomationSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const automation = await prisma.automation.create({
            data: {
                name: data.name,
                type: data.type,
                parameters: data.parameters,
                filters: data.filters,
                enabled: data.enabled ?? true,
            },
        });

        return apiResponse(automation, 201);
    });
}

/**
 * DELETE /api/automations
 * Bulk delete automations
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'automations:delete',
        roles: ['ADMIN'],
        auditEvent: 'AUTOMATION_CHANGE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No automation IDs provided', 400);
        }

        await prisma.automationLog.deleteMany({
            where: { automationId: { in: ids } },
        });

        const result = await prisma.automation.deleteMany({
            where: { id: { in: ids } },
        });

        return apiResponse({ success: true, deleted: result.count });
    });
}

/**
 * PATCH /api/automations
 * Bulk enable/disable
 */
export async function PATCH(request: NextRequest) {
    return withGuard(request, {
        permission: 'automations:update',
        roles: ['ADMIN'],
        auditEvent: 'AUTOMATION_CHANGE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids, enabled } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No automation IDs provided', 400);
        }

        const result = await prisma.automation.updateMany({
            where: { id: { in: ids } },
            data: { enabled: enabled ?? true },
        });

        return apiResponse({ success: true, updated: result.count });
    });
}
