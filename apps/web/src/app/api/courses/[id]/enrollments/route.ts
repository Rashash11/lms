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

// Query schema for GET
const listQuerySchema = paginationSchema.extend({
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED']).optional(),
});

/**
 * GET /api/courses/[id]/enrollments
 * List all enrollments for a course
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;

    return withGuard(request, {
        permission: 'enrollments:read'
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

        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause
        const where: any = { courseId };
        if (status) {
            where.status = status;
        }

        // 3. Fetch enrollments
        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.enrollment.count({ where }),
        ]);

        // 4. Fetch user details
        const userIds = enrollments.map(e => e.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
            },
        });

        // 5. Combine data
        const enrichedEnrollments = enrollments.map(enrollment => {
            const user = users.find(u => u.id === enrollment.userId);
            return {
                id: enrollment.id,
                userId: enrollment.userId,
                status: enrollment.status,
                progress: enrollment.progress,
                score: enrollment.score ? parseFloat(enrollment.score.toString()) : null,
                enrolledAt: enrollment.createdAt,
                startedAt: enrollment.startedAt,
                completedAt: enrollment.completedAt,
                lastAccessedAt: enrollment.lastAccessedAt,
                user: user ? {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    avatar: user.avatar,
                } : null,
            };
        });

        return apiResponse({
            data: enrichedEnrollments,
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
 * POST /api/courses/[id]/enrollments
 * Create new enrollment(s)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;

    return withGuard(request, {
        permission: 'enrollments:create',
        auditEvent: 'ENROLLMENT_CREATE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, enrollmentSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const userIdsToEnroll = data.userIds || (data.userId ? [data.userId] : []);

        if (userIdsToEnroll.length === 0) {
            return apiError('No users specified', 400);
        }

        // 2. Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, title: true, tenantId: true }
        });

        if (!course) {
            return apiError('Course not found', 404);
        }

        // 3. Check for existing enrollments
        const existing = await prisma.enrollment.findMany({
            where: {
                courseId,
                userId: { in: userIdsToEnroll },
            },
            select: { userId: true }
        });

        const alreadyEnrolledIds = existing.map(e => e.userId);
        const newUserIds = userIdsToEnroll.filter(id => !alreadyEnrolledIds.includes(id));

        if (newUserIds.length === 0) {
            return apiError('All specified users are already enrolled', 400);
        }

        // 4. Create enrollments
        const result = await prisma.enrollment.createMany({
            data: newUserIds.map(userId => ({
                userId,
                courseId,
                status: 'NOT_STARTED',
                progress: 0,
            })),
        });

        // 5. Queue notifications and timeline events (fire and forget)
        for (const userId of newUserIds) {
            jobs.timeline.addEvent({
                userId,
                tenantId: ctx.session.tenantId,
                eventType: 'ENROLLMENT_CREATED',
                courseId,
                details: { courseTitle: course.title, enrolledBy: ctx.session.userId },
            }).catch(console.error);

            jobs.notification.send({
                type: 'in_app',
                recipientId: userId,
                tenantId: ctx.session.tenantId,
                title: 'New Course Enrollment',
                body: `You have been enrolled in "${course.title}"`,
                link: `/learn/courses/${courseId}`,
            }).catch(console.error);
        }

        return apiResponse({
            success: true,
            enrolled: result.count,
            skipped: alreadyEnrolledIds.length,
            alreadyEnrolled: alreadyEnrolledIds,
        }, 201);
    });
}

/**
 * DELETE /api/courses/[id]/enrollments
 * Remove enrollment
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;

    return withGuard(request, {
        permission: 'enrollments:delete',
        auditEvent: 'ENROLLMENT_DELETE',
    }, async (ctx: GuardedContext) => {
        const enrollmentId = request.nextUrl.searchParams.get('enrollmentId');
        const userId = request.nextUrl.searchParams.get('userId');

        if (!enrollmentId && !userId) {
            return apiError('Either enrollmentId or userId is required', 400);
        }

        try {
            if (enrollmentId) {
                await prisma.enrollment.delete({ where: { id: enrollmentId } });
            } else if (userId) {
                await prisma.enrollment.deleteMany({
                    where: {
                        userId,
                        courseId,
                    },
                });
            }

            return apiResponse({ success: true });
        } catch (error: any) {
            if (error?.code === 'P2025') {
                return apiError('Enrollment not found', 404);
            }
            throw error;
        }
    });
}

