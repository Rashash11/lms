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
    notificationSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    eventKey: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});

/**
 * GET /api/notifications
 * List all notification templates
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'notifications:read'
    }, async (ctx: GuardedContext) => {
        // 1. Validate query
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, listQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { search, eventKey, isActive, page, limit } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { messageSubject: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (eventKey) {
            where.eventKey = eventKey;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // 3. Fetch notifications
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({ where }),
        ]);

        return apiResponse({
            data: notifications,
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
 * POST /api/notifications
 * Create a notification template
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'notifications:create',
        roles: ['ADMIN'],
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, notificationSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // 2. Create notification
        const notification = await prisma.notification.create({
            data: {
                name: data.name,
                eventKey: data.eventKey,
                messageSubject: data.subject,
                messageBody: data.body,
                hoursOffset: data.hoursOffset,
                offsetDirection: data.offsetDirection,
                filterCourses: data.filterCourses || [],
                filterGroups: data.filterGroups || [],
                filterBranches: data.filterBranches || [],
                recipientType: data.recipientType,
                recipientUserId: data.recipientUserId,
                isActive: data.isActive ?? true,
            },
        });

        return apiResponse(notification, 201);
    });
}

/**
 * DELETE /api/notifications
 * Bulk delete notifications
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'notifications:delete',
        roles: ['ADMIN'],
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No notification IDs provided', 400);
        }

        const result = await prisma.notification.deleteMany({
            where: { id: { in: ids } },
        });

        return apiResponse({ success: true, deleted: result.count });
    });
}

/**
 * PATCH /api/notifications
 * Bulk enable/disable notifications
 */
export async function PATCH(request: NextRequest) {
    return withGuard(request, {
        permission: 'notifications:update',
        roles: ['ADMIN'],
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids, isActive } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No notification IDs provided', 400);
        }

        const result = await prisma.notification.updateMany({
            where: { id: { in: ids } },
            data: { isActive: isActive ?? true },
        });

        return apiResponse({ success: true, updated: result.count });
    });
}

