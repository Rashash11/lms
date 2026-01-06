import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'submission:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: submission:read' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'assignments';

        // Get instructor's courses
        const instructorCourses = await prisma.course.findMany({
            where: {
                instructorId: session.userId
            },
            select: {
                id: true
            }
        });

        const courseIds = instructorCourses.map(c => c.id);

        if (tab === 'assignments') {
            // Fetch pending assignment submissions
            const submissions = await prisma.assignmentSubmission.findMany({
                where: {
                    courseId: { in: courseIds },
                    status: 'pending'
                },
                take: 50,
                orderBy: {
                    submittedAt: 'desc'
                }
            });

            return NextResponse.json({ submissions, total: submissions.length });
        } else if (tab === 'ilt') {
            // Fetch ILT sessions needing grading
            const iltSessions = await prisma.iLTAttendance.findMany({
                where: {
                    status: 'pending',
                    gradedAt: null
                },
                take: 50,
                orderBy: {
                    id: 'desc'
                }
            });

            return NextResponse.json({ iltSessions, total: iltSessions.length });
        }

        return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching grading hub data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
