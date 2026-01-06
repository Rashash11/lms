import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/learner/courses/[courseId]/last-unit
 * Returns the last accessed unit for the logged-in learner in the specified course.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await requireAuth();
        const { courseId } = await context.params;

        // Validate courseId is a valid UUID
        if (!courseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        // Query learner course state
        const state = await prisma.learner_course_state.findFirst({
            where: {
                userId: session.userId,
                courseId: courseId
            }
        });

        if (!state) {
            // No resume state exists yet - return null
            return NextResponse.json({
                courseId,
                lastUnitId: null,
                lastAccessedAt: null
            });
        }

        // Return the last unit
        return NextResponse.json({
            courseId: state.courseId,
            lastUnitId: state.lastUnitId,
            lastAccessedAt: state.lastAccessedAt
        });
    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching last unit:', error);
        return NextResponse.json({ error: 'Failed to fetch last unit' }, { status: 500 });
    }
}

/**
 * POST /api/learner/courses/[courseId]/last-unit
 * Updates the last accessed unit for the logged-in learner in the specified course.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await requireAuth();
        const { courseId } = await context.params;

        // Validate courseId
        if (!courseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const body = await request.json();
        const { unitId } = body;

        if (!unitId) {
            return NextResponse.json({ error: 'unitId is required' }, { status: 400 });
        }

        // Verify enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.userId,
                    courseId: courseId
                }
            }
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
        }

        // Verify unit belongs to course
        const unit = await prisma.courseUnit.findFirst({
            where: {
                id: unitId,
                courseId: courseId
            }
        });

        if (!unit) {
            return NextResponse.json({ error: 'Unit not found in this course' }, { status: 404 });
        }

        // Upsert learner course state
        const state = await prisma.learner_course_state.upsert({
            where: {
                userId_courseId: {
                    userId: session.userId,
                    courseId: courseId
                }
            },
            update: {
                lastUnitId: unitId,
                lastAccessedAt: new Date(),
                updatedAt: new Date()
            },
            create: {
                userId: session.userId,
                courseId: courseId,
                lastUnitId: unitId,
                lastAccessedAt: new Date()
            }
        });

        return NextResponse.json({
            courseId: state.courseId,
            lastUnitId: state.lastUnitId,
            lastAccessedAt: state.lastAccessedAt
        });
    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error updating last unit:', error);

        // Development: detailed error
        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json({
                error: 'Failed to update last unit',
                message: error?.message,
                code: error?.code
            }, { status: 500 });
        }

        return NextResponse.json({ error: 'Failed to update last unit' }, { status: 500 });
    }
}
