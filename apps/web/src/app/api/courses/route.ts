
export const dynamic = 'force-dynamic';
/**
 * Reference implementation of courses API using the new withGuard pattern
 * This file demonstrates the recommended way to implement secured API routes
 * 
 * Changes from old pattern:
 * 1. Uses withGuard instead of withTenant + manual auth
 * 2. Uses validateBody for schema validation
 * 3. Consistent error handling via apiResponse/apiError
 * 4. Audit logging built-in
 * 5. Rate limiting automatic
 */

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
    courseSchemas,
    paginationSchema,
    searchSchema,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';

// Combined query schema for GET
const listQuerySchema = paginationSchema.merge(searchSchema).extend({
    categoryId: z.string().uuid().optional(),
    hidden: z.enum(['true', 'false']).optional(),
});

/**
 * GET /api/courses
 * List all courses with pagination and filters
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'course:read'
    }, async (ctx: GuardedContext) => {
        // 1. Validate query params
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, listQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { page, limit, sortBy, sortOrder, search, status, categoryId, hidden } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (hidden !== undefined) {
            where.hiddenFromCatalog = hidden === 'true';
        }

        // 3. Apply node scope if needed
        if (ctx.session.nodeId) {
            // If course model has branchId, apply filter
            // where.branchId = ctx.session.nodeId;
        }

        // 4. Execute query
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
                select: {
                    id: true,
                    code: true,
                    title: true,
                    description: true,
                    status: true,
                    hiddenFromCatalog: true,
                    showInCatalog: true,
                    thumbnailUrl: true,
                    tenantId: true, // For isolation tests
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            enrollments: true,
                            units: true,
                        }
                    }
                }
            }),
            prisma.course.count({ where }),
        ]);

        return apiResponse({
            data: courses,
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
 * POST /api/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'course:create',
        auditEvent: 'COURSE_CREATE',
        rateLimit: 'api:default',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, courseSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // 2. Auto-generate code if not provided
        const courseCode = data.code || `COURSE-${Date.now()}`;

        // 3. Check uniqueness
        const existing = await prisma.course.findFirst({
            where: { code: courseCode },
        });

        if (existing) {
            return apiError('Course with this code already exists', 409);
        }

        // 4. Create course
        const course = await prisma.course.create({
            data: {
                code: courseCode,
                title: data.title,
                description: data.description,
                categoryId: data.categoryId,
                instructorId: data.instructorId || ctx.session.userId,
                status: 'DRAFT',
                isActive: false,
                showInCatalog: data.showInCatalog ?? true,
                capacity: data.capacity,
                timeLimit: data.timeLimit,
                price: data.price,
                enrollmentRequestEnabled: data.enrollmentRequestEnabled ?? false,
            },
        });

        // 5. Create timeline event (fire and forget)
        prisma.timelineEvent.create({
            data: {
                tenantId: ctx.session.tenantId,
                userId: ctx.session.userId,
                courseId: course.id,
                eventType: 'COURSE_CREATED',
                details: { title: course.title, code: course.code },
            },
        }).catch(console.error);

        return apiResponse(course, 201);
    });
}

/**
 * DELETE /api/courses (bulk)
 * Soft delete multiple courses
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'course:delete',
        auditEvent: 'COURSE_DELETE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        const bodySchema = z.object({
            ids: z.array(z.string().uuid()).min(1).max(50),
        });

        let data;
        try {
            data = await validateBody(request, bodySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // 2. Delete related records first (cascade not automatic for all)
        await prisma.groupCourse.deleteMany({
            where: { courseId: { in: data.ids } },
        });

        await prisma.courseUnit.deleteMany({
            where: { courseId: { in: data.ids } },
        });

        // 3. Soft delete courses (handled by Prisma middleware)
        const result = await prisma.course.deleteMany({
            where: { id: { in: data.ids } },
        });

        return apiResponse({
            success: true,
            deleted: result.count
        });
    });
}

/**
 * PATCH /api/courses (bulk update)
 * Bulk update course status
 */
export async function PATCH(request: NextRequest) {
    return withGuard(request, {
        permissions: ['course:update', 'course:publish'], // Either permission
        auditEvent: 'COURSE_UPDATE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        const bodySchema = z.object({
            ids: z.array(z.string().uuid()).min(1).max(50),
            action: z.enum(['publish', 'unpublish', 'hide', 'show']),
        });

        let data;
        try {
            data = await validateBody(request, bodySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // 2. Map action to update data
        const updateData: Record<string, any> = {};
        switch (data.action) {
            case 'publish':
                updateData.status = 'PUBLISHED';
                updateData.lastPublishedAt = new Date();
                break;
            case 'unpublish':
                updateData.status = 'DRAFT';
                break;
            case 'hide':
                updateData.hiddenFromCatalog = true;
                break;
            case 'show':
                updateData.hiddenFromCatalog = false;
                break;
        }

        // 3. Execute update
        const result = await prisma.course.updateMany({
            where: { id: { in: data.ids } },
            data: updateData,
        });

        return apiResponse({
            success: true,
            updated: result.count
        });
    });
}
