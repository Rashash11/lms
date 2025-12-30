export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const [
            totalUsers,
            activeUsers,
            totalCourses,
            publishedCourses,
            totalLearningPaths,
            upcomingConferences,
            timeline,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'ACTIVE' } }),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.learningPath.count(),
            prisma.conference.findMany({
                where: {
                    startTime: {
                        gte: new Date(),
                    },
                },
                orderBy: {
                    startTime: 'asc',
                },
                take: 5,
            }),
            prisma.timelineEvent.findMany({
                orderBy: { timestamp: 'desc' },
                take: 10,
            }),
        ]);

        return NextResponse.json({
            stats: {
                totalUsers,
                activeUsers,
                totalCourses,
                publishedCourses,
                totalLearningPaths,
                totalAssignments: 0, // Placeholder
            },
            upcomingConferences,
            timeline,
            activityData: [
                { day: 'Mon', logins: 40, completions: 20 },
                { day: 'Tue', logins: 70, completions: 35 },
                { day: 'Wed', logins: 45, completions: 25 },
                { day: 'Thu', logins: 90, completions: 50 },
                { day: 'Fri', logins: 65, completions: 30 },
                { day: 'Sat', logins: 85, completions: 45 },
                { day: 'Sun', logins: 30, completions: 15 },
            ],
            userBreakdown: [
                { label: 'Admins', value: 1, color: 'hsl(var(--primary))' },
                { label: 'Instructors', value: 2, color: 'hsl(var(--secondary))' },
                { label: 'Learners', value: Math.max(0, totalUsers - 3), color: 'hsl(var(--tertiary, 200 80% 50%))' },
            ],
        });
    } catch (error) {
        console.error('Error fetching super instructor dashboard stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
