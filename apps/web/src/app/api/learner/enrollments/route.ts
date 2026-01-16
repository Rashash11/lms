import { withGuard } from '@/lib/api-guard';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic';
/**
 * GET /api/learner/enrollments
 * Returns all enrollments for the logged-in learner with course details.
 */
const GET_handler = async (request: NextRequest) => {
    try {
        const session = await requireAuth();

        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: session.userId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        code: true,
                        description: true,
                        status: true,
                        thumbnailUrl: true,
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // TEMPORARY: Simplified progress calculation without user_unit_progress table
        // The user_unit_progress table doesn't exist yet, so we'll provide basic stats
        // TODO: Re-enable batch optimization when schema includes progress tracking
        const courseIds = enrollments.map(e => e.courseId);

        // Get total units per course
        const unitCountsPerCourse = await Promise.all(
            courseIds.map(async (courseId) => ({
                courseId,
                count: await prisma.courseUnit.count({
                    where: {
                        courseId,
                        status: 'PUBLISHED'
                    }
                })
            }))
        );

        // Get resume states if table exists
        let resumeStates: any[] = [];
        try {
            resumeStates = await prisma.learnerCourseState?.findMany({
                where: {
                    userId: session.userId,
                    courseId: { in: courseIds }
                },
                select: {
                    courseId: true,
                    lastUnitId: true,
                    lastAccessedAt: true
                }
            }) || [];
        } catch (e) {
            console.warn("learner_course_state table not available yet");
        }

        // Build lookup maps
        const unitCountMap = new Map(unitCountsPerCourse.map(u => [u.courseId, u.count]));
        const resumeMap = new Map(resumeStates.map((s: any) => [s.courseId, s]));

        // Add stats to each enrollment
        const enrollmentsWithStats = enrollments.map(enrollment => {
            const totalUnits = unitCountMap.get(enrollment.courseId) || 0;
            const resumeState = resumeMap.get(enrollment.courseId);

            return {
                ...enrollment,
                stats: {
                    totalUnits,
                    completedUnits: 0, // TODO: Calculate when user_unit_progress exists
                    percent: 0 // TODO: Calculate when user_unit_progress exists
                },
                resumeState: resumeState ? {
                    lastUnitId: (resumeState as any).lastUnitId,
                    lastAccessedAt: (resumeState as any).lastAccessedAt
                } : null
            };
        });

        return NextResponse.json(enrollmentsWithStats);
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
        console.error("LEARNER_ENROLLMENTS_500:", error);
        console.error("Error details:", {
            name: error?.name,
            message: error?.message,
            code: error?.code
        });

        // Development: Return detailed error
        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json(
                {
                    error: "ENROLLMENTS_500",
                    message: error?.message,
                    stack: error?.stack?.split('\n').slice(0, 8)
                },
                { status: 500 }
            );
        }

        // Production: Generic error
        return NextResponse.json(
            { error: 'Failed to fetch enrollments' },
            { status: 500 }
        );
    }
}
export async function GET(request: NextRequest) {
    return withGuard(request, { roles: ['LEARNER'] }, () => GET_handler(request));
}
