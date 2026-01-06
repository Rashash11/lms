
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/courses/[id]/enroll
 * Allows a learner to self-enroll in a course.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id: courseId } = await context.params;

        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, status: true, title: true }
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (course.status !== 'PUBLISHED') {
            return NextResponse.json({ error: 'Cannot enroll in an unpublished course' }, { status: 403 });
        }

        // Check if already enrolled (Idempotent upsert logic)
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.userId,
                    courseId: course.id
                }
            }
        });

        if (existingEnrollment) {
            return NextResponse.json(existingEnrollment, { status: 200 });
        }

        // Create enrollment
        const enrollment = await prisma.enrollment.create({
            data: {
                userId: session.userId,
                courseId: course.id,
                status: 'IN_PROGRESS',
                progress: 0,
            }
        });

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId: session.userId,
                courseId: course.id,
                eventType: 'COURSE_ENROLLED',
                details: { courseTitle: course.title },
            }
        });

        return NextResponse.json(enrollment, { status: 201 });
    } catch (error) {
        if (error instanceof Error && (error as any).statusCode === 401) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Error in self-enrollment:', error);
        return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }
}
