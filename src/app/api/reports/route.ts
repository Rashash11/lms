import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET report data
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'user-progress';

        // Basic analytics for the dashboard
        const [totalUsers, totalCourses, completedEnrollments, totalEnrollments] = await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
            prisma.enrollment.count(),
        ]);

        const completionRate = totalEnrollments > 0
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0;

        const stats = {
            totalUsers,
            totalCourses,
            completionRate: `${completionRate}%`,
            activeLearners: totalUsers, // Simplified
        };

        if (type === 'user-progress') {
            const progress = await (prisma.enrollment as any).findMany({
                take: 50,
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    course: { select: { title: true } }
                }
            });
            return NextResponse.json({ stats, data: progress });
        }

        return NextResponse.json({ stats, data: [] });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
