export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, GuardedContext } from '@/lib/api-guard';

/**
 * GET /api/dashboard
 * Get dashboard stats
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'dashboard:read'
    }, async (ctx: GuardedContext) => {
        const [
            totalUsers,
            activeUsers,
            totalCourses,
            publishedCourses,
            totalBranches,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'ACTIVE' } }),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.branch.count(),
        ]);

        // Get timeline events
        const timeline = await prisma.timelineEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10,
        });

        return apiResponse({
            stats: {
                activeUsers,
                totalUsers,
                totalCourses,
                publishedCourses,
                totalBranches,
            },
            timeline,
            trainingTime: '0h 0m',
        });
    });
}
