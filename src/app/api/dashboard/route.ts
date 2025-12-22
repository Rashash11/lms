import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET dashboard stats
export async function GET(request: NextRequest) {
    try {
        const [
            totalUsers,
            activeUsers,
            totalCourses,
            publishedCourses,
            totalBranches,
            recentLogins,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'ACTIVE' } }),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.branch.count(),
            prisma.timelineEvent.findMany({
                where: { eventType: 'signin' },
                orderBy: { timestamp: 'desc' },
                take: 10,
            }),
        ]);

        // Get timeline events
        const timeline = await prisma.timelineEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10,
        });

        return NextResponse.json({
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
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
