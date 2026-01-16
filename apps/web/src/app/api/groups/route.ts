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
    groupSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// Query schema
const listQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
});

// Extended create schema
const createGroupSchema = groupSchemas.create.extend({
    generateKey: z.boolean().optional(),
    branchId: z.string().uuid().optional(),
});

/**
 * GET /api/groups
 * List all groups with member/course counts
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'group:read'
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

        const { search, page, limit } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause
        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        // 3. Fetch groups with counts
        const [groups, total] = await Promise.all([
            prisma.group.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { members: true, courses: true }
                    }
                }
            }),
            prisma.group.count({ where }),
        ]);

        // Transform to include counts
        const groupsWithCounts = groups.map((group: any) => ({
            ...group,
            memberCount: group._count.members,
            courseCount: group._count.courses,
            _count: undefined,
        }));

        return apiResponse({
            data: groupsWithCounts,
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
 * POST /api/groups
 * Create a new group
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'group:create',
        auditEvent: 'GROUP_CHANGE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, createGroupSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { name, description, price, groupKey, autoEnroll, maxMembers, branchId, generateKey } = data;

        // 2. Generate unique key if requested
        let finalKey = groupKey || null;
        if (generateKey && !finalKey) {
            finalKey = randomBytes(4).toString('hex').toUpperCase();
        }

        // 3. Create group
        const group = await prisma.group.create({
            data: {
                name,
                description,
                price,
                groupKey: finalKey,
                autoEnroll: autoEnroll || false,
                maxMembers,
                branchId,
            },
        });

        return apiResponse(group, 201);
    });
}

/**
 * DELETE /api/groups
 * Bulk delete groups
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'group:delete',
        auditEvent: 'GROUP_CHANGE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No group IDs provided', 400);
        }

        // Delete related records first
        await prisma.groupMember.deleteMany({ where: { groupId: { in: ids } } });
        await prisma.groupCourse.deleteMany({ where: { groupId: { in: ids } } });

        // Delete groups
        const result = await prisma.group.deleteMany({
            where: { id: { in: ids } },
        });

        return apiResponse({ success: true, deleted: result.count });
    });
}

