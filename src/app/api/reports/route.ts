import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthError } from '@/lib/auth';
import { can } from '@/lib/permissions';

// GET report data
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'reports:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', message: 'Missing permission: reports:read' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'overview';

        // Basic analytics for the dashboard - wrap in try-catch for safety
        let totalUsers = 0;
        let totalCourses = 0;
        let completedEnrollments = 0;
        let totalEnrollments = 0;

        try {
            [totalUsers, totalCourses, completedEnrollments, totalEnrollments] = await Promise.all([
                prisma.user.count(),
                prisma.course.count(),
                prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
                prisma.enrollment.count(),
            ]);
        } catch (e) {
            console.warn('Some counts failed, using defaults');
        }

        const completionRate = totalEnrollments > 0
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0;

        const stats = {
            totalUsers,
            totalCourses,
            completionRate: `${completionRate}%`,
            activeLearners: totalUsers,
        };

        // For user-progress, return enrollments without includes (may not exist)
        if (type === 'user-progress') {
            try {
                const enrollments = await prisma.enrollment.findMany({
                    take: 50,
                    orderBy: { updatedAt: 'desc' },
                });
                return NextResponse.json({ stats, data: enrollments });
            } catch (e) {
                console.warn('Enrollment query failed, returning empty data');
                return NextResponse.json({ stats, data: [] });
            }
        }

        return NextResponse.json({ stats, data: [] });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: 'UNAUTHORIZED', message: error.message }, { status: error.statusCode });
        }
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch reports' }, { status: 500 });
    }
}
