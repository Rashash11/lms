import { withGuard } from '@/lib/api-guard';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic';
/**
 * GET /api/learner/progress?courseId=...
 * Returns stable stats for a specific course.
 * UPDATED: Works without user_unit_progress table (defaults to 0 progress)
 */
const GET_handler = async (request: NextRequest) => {
    try {
        const session = await requireAuth();
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        }

        // Validate enrollment
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId: session.userId,
                courseId: courseId
            }
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 404 });
        }

        const totalUnits = await prisma.courseUnit.count({
            where: { courseId: courseId, status: 'PUBLISHED' }
        });

        // TEMPORARY: user_unit_progress table doesn't exist yet
        // TODO: Re-enable when progress tracking schema is added
        let completedUnitsCount = 0;
        let completedUnitIds: string[] = [];
        let latestCompletion: Date | null = null;

        /* DISABLED until user_unit_progress table exists
        const completedUnits = await prisma.user_unit_progress.findMany({
            where: {
                userId: session.userId,
                courseId: courseId,
                status: 'COMPLETED'
            },
            select: {
                unitId: true,
                completedAt: true
            }
        });

        completedUnitsCount = completedUnits.length;
        completedUnitIds = completedUnits.map(u => u.unitId);
        latestCompletion = completedUnits.length > 0
            ? completedUnits.reduce((latest, current) =>
                (current.completedAt && (!latest || current.completedAt > latest)) ? current.completedAt : latest,
                null as Date | null)
            : null;
        */

        // Try to get last activity from learnerCourseState if available
        let lastActivity: Date | null = null;
        try {
            const resumeState = await prisma.learnerCourseState?.findFirst({
                where: {
                    userId: session.userId,
                    courseId: courseId
                },
                select: {
                    lastAccessedAt: true
                }
            });
            lastActivity = resumeState?.lastAccessedAt || enrollment.updatedAt;
        } catch (e) {
            // learner_course_state table doesn't exist, use enrollment date
            lastActivity = enrollment.updatedAt;
        }

        return NextResponse.json({
            courseId,
            completedUnits: completedUnitsCount,
            completedUnitIds,
            totalUnits,
            percent: totalUnits > 0 ? Math.round((completedUnitsCount / totalUnits) * 100) : 0,
            lastUnitCompletedAt: latestCompletion,
            lastActivity: lastActivity,
            updatedAt: enrollment.updatedAt
        });
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
        console.error("LEARNER_PROGRESS_500:", error);
        console.error("Error details:", {
            name: error?.name,
            message: error?.message,
            code: error?.code
        });

        // Development: Return detailed error
        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json(
                {
                    error: "PROGRESS_500",
                    message: error?.message,
                    stack: error?.stack?.split('\n').slice(0, 8)
                },
                { status: 500 }
            );
        }

        // Production: Generic error
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}
export async function GET(request: NextRequest) {
    return withGuard(request, { roles: ['LEARNER'] }, () => GET_handler(request));
}
