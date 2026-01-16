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
    enrollmentSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { jobs } from '@/lib/jobs';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    userId: z.string().uuid().optional(),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'all']).optional(),
    search: z.string().optional(),
});

/**
 * GET /api/enrollments
 * List learner's enrolled courses
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'enrollments:read'
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

        const { status, search, page, limit } = query;
        const userId = query.userId || ctx.session.userId;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.course = {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ]
            };
        }

        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    course: {
                        select: {
                            id: true,
                            code: true,
                            title: true,
                            description: true,
                            thumbnailUrl: true,
                            status: true,
                        }
                    }
                }
            }),
            prisma.enrollment.count({ where }),
        ]);

        // Calculate stats
        const stats = await prisma.enrollment.groupBy({
            by: ['status'],
            where: { userId },
            _count: { id: true },
        });

        const statsMap: any = {
            total: 0,
            inProgress: 0,
            completed: 0,
            notStarted: 0,
        };

        stats.forEach((s: any) => {
            statsMap.total += s._count.id;
            if (s.status === 'IN_PROGRESS') statsMap.inProgress = s._count.id;
            if (s.status === 'COMPLETED') statsMap.completed = s._count.id;
            if (s.status === 'NOT_STARTED') statsMap.notStarted = s._count.id;
        });

        return apiResponse({
            data: enrollments,
            stats: statsMap,
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
 * POST /api/enrollments
 * Enroll user in course
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'enrollments:create',
        auditEvent: 'ENROLLMENT_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, enrollmentSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { userId, courseId } = data;

        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return apiError('Course not found', 404);
        }

        if (course.status !== 'PUBLISHED') {
            return apiError('Cannot enroll in unpublished course', 400);
        }

        // Check capacity
        if (course.capacity) {
            const enrollmentCount = await prisma.enrollment.count({
                where: { courseId },
            });
            if (enrollmentCount >= course.capacity) {
                return apiError('Course is at full capacity', 400);
            }
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (existing) {
            return apiError('Already enrolled in this course', 400);
        }

        // Calculate expiration
        let expiresAt: Date | null = null;
        if (course.expiration) {
            expiresAt = course.expiration;
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: 'NOT_STARTED',
                expiresAt,
            },
            include: { course: true },
        });

        // Queue timeline event
        jobs.timeline.addEvent({
            userId,
            tenantId: ctx.session.tenantId,
            eventType: 'COURSE_ENROLLED',
            details: { courseTitle: course.title, courseId },
        }).catch(console.error);

        return apiResponse(enrollment, 201);
    });
}
