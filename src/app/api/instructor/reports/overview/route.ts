export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activeRole = session.activeRole;
        if (activeRole !== 'INSTRUCTOR' && activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get instructor's courses count
        const coursesCount = await prisma.course.count({
            where: {
                instructorId: session.userId
            }
        });

        // Get instructor's learning paths count
        const learningPathsCount = await prisma.learningPath.count({
            where: {
                instructorId: session.userId
            }
        });

        // Get total enrollments in instructor's courses
        const instructorCourses = await prisma.course.findMany({
            where: {
                instructorId: session.userId
            },
            select: {
                id: true
            }
        });

        const courseIds = instructorCourses.map(c => c.id);

        const enrollmentsCount = await prisma.enrollment.count({
            where: {
                courseId: { in: courseIds }
            }
        });

        // Calculate completion rate
        const completedEnrollments = await prisma.enrollment.count({
            where: {
                courseId: { in: courseIds },
                status: 'COMPLETED'
            }
        });

        const completionRate = enrollmentsCount > 0
            ? ((completedEnrollments / enrollmentsCount) * 100).toFixed(1)
            : '0.0';

        return NextResponse.json({
            courses: coursesCount,
            learningPaths: learningPathsCount,
            learningActivities: 0, // Placeholder
            trainingMatrix: completionRate,
            timeline: 0, // Placeholder
            trainingTime: '0h 0m' // Placeholder
        });
    } catch (error) {
        console.error('Error fetching reports overview:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
