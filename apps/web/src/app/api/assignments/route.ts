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
    assignmentSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { jobs } from '@/lib/jobs';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    courseId: z.string().uuid().optional(),
});

/**
 * GET /api/assignments
 * List assignments based on role
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'assignment:read'
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

        const { courseId, page, limit } = query;
        const skip = (page - 1) * limit;

        // 2. Build filter based on role
        const where: any = {};
        if (courseId) {
            where.courseId = courseId;
        }

        // ROLE-BASED ACCESS CONTROL
        if (ctx.session.role === 'LEARNER') {
            // Learners only see assignments from enrolled courses
            const enrollments = await prisma.enrollment.findMany({
                where: { userId: ctx.session.userId },
                select: { courseId: true }
            });
            const enrolledCourseIds = enrollments.map(e => e.courseId);

            if (courseId) {
                if (!enrolledCourseIds.includes(courseId)) {
                    return apiError('Not enrolled in this course', 403);
                }
            } else {
                where.courseId = { in: enrolledCourseIds };
            }
        } else if (ctx.session.role === 'INSTRUCTOR') {
            // Instructors see assignments from courses they manage
            if (courseId) {
                const course = await prisma.course.findUnique({
                    where: { id: courseId },
                    include: { instructors: true }
                });

                const isManager = course?.instructorId === ctx.session.userId ||
                    course?.instructors?.some((i: any) => i.userId === ctx.session.userId);

                if (!isManager) {
                    return apiError('You do not manage this course', 403);
                }
            } else {
                const managedCourses = await prisma.course.findMany({
                    where: {
                        OR: [
                            { instructorId: ctx.session.userId },
                            { instructors: { some: { userId: ctx.session.userId } } }
                        ]
                    },
                    select: { id: true }
                });
                where.courseId = { in: managedCourses.map(c => c.id) };
            }
        }
        // ADMIN/SUPER_INSTRUCTOR see all (tenant-scoped by middleware)

        // 3. Fetch assignments
        const [assignments, total] = await Promise.all([
            prisma.assignment.findMany({
                where,
                skip,
                take: limit,
                include: {
                    course: {
                        select: { title: true, code: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.assignment.count({ where }),
        ]);

        return apiResponse({
            data: assignments,
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
 * POST /api/assignments
 * Create a new assignment
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'assignment:create',
        auditEvent: 'ASSIGNMENT_SUBMIT',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, assignmentSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { title, description, courseId, dueAt } = data;

        // 2. Check course permissions for instructors
        if (ctx.session.role === 'INSTRUCTOR' && courseId) {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: { instructors: true }
            });

            if (!course) {
                return apiError('Course not found', 404);
            }

            const isManager = course.instructorId === ctx.session.userId ||
                (course.instructors as any[])?.some((i: any) => i.userId === ctx.session.userId);

            if (!isManager) {
                return apiError('You do not have permission to manage this course', 403);
            }
        }

        // 3. Create assignment
        const assignment = await prisma.assignment.create({
            data: {
                title,
                description: description || null,
                dueAt: dueAt ? new Date(dueAt) : null,
                createdBy: ctx.session.userId,
                tenant: { connect: { id: ctx.session.tenantId } },
                ...(courseId ? { course: { connect: { id: courseId } } } : {}),
            },
        });

        // 4. Queue timeline event
        if (courseId) {
            jobs.timeline.addEvent({
                userId: ctx.session.userId,
                tenantId: ctx.session.tenantId,
                eventType: 'ASSIGNMENT_CREATED',
                courseId,
                details: { assignmentId: assignment.id, title },
            }).catch(console.error);
        }

        return apiResponse(assignment, 201);
    });
}

