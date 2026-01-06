import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/learner/assignments
 * Returns assignments for the logged-in learner based on their enrollments.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();

        // Only learners can access this endpoint
        if (session.activeRole !== 'LEARNER') {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'This endpoint is for learners only' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        // Get all enrolled courses for the learner
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: session.userId },
            select: { courseId: true }
        });
        const enrolledCourseIds = enrollments.map(e => e.courseId);

        // Build assignment query
        const where: any = {
            OR: [
                // Assignments from enrolled courses
                {
                    courseId: { in: enrolledCourseIds }
                },
                // Global assignments (no course)
                {
                    courseId: null
                }
            ]
        };

        // If courseId specified, filter to that course only
        if (courseId) {
            // Verify learner is enrolled in this course
            if (!enrolledCourseIds.includes(courseId)) {
                return NextResponse.json(
                    { error: 'FORBIDDEN', message: 'Not enrolled in this course' },
                    { status: 403 }
                );
            }
            where.courseId = courseId;
            delete where.OR; // Remove OR condition when filtering by specific course
        }

        // Fetch assignments
        const assignments = await prisma.assignment.findMany({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                courseId: true,
                dueAt: true,
                createdAt: true,
                course: {
                    select: {
                        title: true,
                        code: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to latest 50 assignments
        });

        return NextResponse.json(assignments);
    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Permission errors - return 403
        if (error?.statusCode === 403) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: error.message || 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Other errors - log and return 500
        console.error("LEARNER_ASSIGNMENTS_500:", error);
        console.error("Error details:", {
            name: error?.name,
            message: error?.message,
            code: error?.code
        });

        // Development: Return detailed error
        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json(
                {
                    error: "ASSIGNMENTS_500",
                    message: error?.message,
                    stack: error?.stack?.split('\n').slice(0, 8)
                },
                { status: 500 }
            );
        }

        // Production: Generic error
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}
