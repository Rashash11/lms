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
    notificationSchemas,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    tab: z.enum(['overview', 'history', 'pending']).optional(),
    search: z.string().optional(),
});

/**
 * GET /api/admin/notifications
 * List notifications (overview, history, or pending)
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'notifications:read',
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

        const { tab, search, page, limit } = query;
        const skip = (page - 1) * limit;

        if (tab === 'history') {
            const where: any = {};
            if (search) {
                where.OR = [
                    { recipientEmail: { contains: search, mode: 'insensitive' } },
                    { eventKey: { contains: search, mode: 'insensitive' } },
                ];
            }

            const [history, total] = await Promise.all([
                prisma.notificationHistory.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { sentAt: 'desc' },
                    include: {
                        notification: {
                            select: { name: true, eventKey: true },
                        },
                    },
                }),
                prisma.notificationHistory.count({ where }),
            ]);

            return apiResponse({
                data: history,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            });
        }

        if (tab === 'pending') {
            const where: any = { status: 'PENDING' };
            if (search) {
                where.OR = [
                    { recipientEmail: { contains: search, mode: 'insensitive' } },
                ];
            }

            const [pending, total] = await Promise.all([
                prisma.notificationQueue.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { scheduledFor: 'asc' },
                    include: {
                        notification: {
                            select: { name: true, eventKey: true },
                        },
                    },
                }),
                prisma.notificationQueue.count({ where }),
            ]);

            return apiResponse({
                data: pending,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            });
        }

        // Default: overview
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { eventKey: { contains: search, mode: 'insensitive' } },
                { messageSubject: { contains: search, mode: 'insensitive' } },
            ];
        }

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
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    });
}

/**
 * POST /api/admin/notifications
 * Create notification template
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'notifications:create',
        roles: ['ADMIN'],
        auditEvent: 'NOTIFICATION_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, notificationSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const notification = await prisma.notification.create({
            data: {
                name: data.name,
                eventKey: data.eventKey,
                isActive: data.isActive ?? true,
                hoursOffset: data.hoursOffset,
                offsetDirection: data.offsetDirection,
                filterCourses: data.filterCourses || [],
                filterGroups: data.filterGroups || [],
                filterBranches: data.filterBranches || [],
                recipientType: data.recipientType,
                recipientUserId: data.recipientUserId,
                messageSubject: data.subject,
                messageBody: data.body,
            },
        });

        return apiResponse(notification, 201);
    });
}

/**
 * DELETE /api/admin/notifications
 * Bulk delete notifications
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'notifications:delete',
        roles: ['ADMIN'],
        auditEvent: 'NOTIFICATION_CHANGE',
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
