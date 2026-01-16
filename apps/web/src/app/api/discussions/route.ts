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
    courseId: z.string().uuid().optional(),
});

// Create schema
const createDiscussionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    courseId: z.string().uuid().optional(),
});

/**
 * GET /api/discussions
 * List discussions with filtering
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'discussions:read'
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

        const { search, courseId, page, limit } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.topic = { contains: search, mode: 'insensitive' };
        }
        if (courseId) {
            where.audienceType = 'COURSE';
            where.audienceId = courseId;
        }

        const [discussions, total] = await Promise.all([
            prisma.discussion.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.discussion.count({ where }),
        ]);

        // Get comment counts
        const discussionIds = discussions.map((d) => d.id);
        const counts = discussionIds.length
            ? await prisma.discussionComment.groupBy({
                by: ['discussionId'],
                where: { discussionId: { in: discussionIds } },
                _count: { id: true },
            })
            : [];

        const countMap = new Map(counts.map((c) => [c.discussionId, c._count.id]));

        const discussionsWithCounts = discussions.map((d) => ({
            ...d,
            postCount: countMap.get(d.id) || 0,
        }));

        return apiResponse({
            data: discussionsWithCounts,
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
 * POST /api/discussions
 * Create a discussion
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'discussions:create',
        auditEvent: 'DISCUSSION_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, createDiscussionSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const discussion = await prisma.discussion.create({
            data: {
                topic: data.title,
                body: data.description || '',
                audienceType: data.courseId ? 'COURSE' : 'EVERYONE',
                audienceId: data.courseId || null,
                createdBy: ctx.session.userId,
            },
        });

        return apiResponse(discussion, 201);
    });
}

/**
 * DELETE /api/discussions
 * Bulk delete discussions
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'discussions:delete',
        auditEvent: 'DISCUSSION_CHANGE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No discussion IDs provided', 400);
        }

        // Delete comments first
        await prisma.discussionComment.deleteMany({
            where: { discussionId: { in: ids } },
        });

        const result = await prisma.discussion.deleteMany({
            where: { id: { in: ids } },
        });

        return apiResponse({ success: true, deleted: result.count });
    });
}
