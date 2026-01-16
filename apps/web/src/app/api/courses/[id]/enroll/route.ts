import { withGuard, apiError, apiResponse } from '@/lib/api-guard';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/courses/[id]/enroll
 * Allows a learner to self-enroll in a course.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, {}, async (ctx) => {
        const { id: courseId } = await context.params;
        const { session } = ctx;

        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, status: true, title: true }
        });

        if (!course) {
            return apiError('Course not found', 404);
        }

        if (course.status !== 'PUBLISHED') {
            return apiError('Cannot enroll in an unpublished course', 403);
        }

        // Check if already enrolled (Idempotent upsert logic)
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                tenantId_userId_courseId: {
                    tenantId: session.tenantId,
                    userId: session.userId,
                    courseId: course.id
                }
            }
        });

        if (existingEnrollment) {
            return apiResponse(existingEnrollment);
        }

        // Create enrollment
        const enrollment = await prisma.enrollment.create({
            data: {
                tenantId: session.tenantId,
                userId: session.userId,
                courseId: course.id,
                status: 'IN_PROGRESS',
                progress: 0,
            }
        });

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                tenantId: session.tenantId,
                userId: session.userId,
                courseId: course.id,
                eventType: 'COURSE_ENROLLED',
                details: { courseTitle: course.title },
            }
        }).catch(console.error);

        return apiResponse(enrollment, 201);
    });
}
