import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET course player data (for learner taking a course)
export async function GET(
    request: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get course
        const course = await prisma.course.findUnique({
            where: { id: params.courseId },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Get enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: params.courseId } },
        });

        if (!enrollment) {
            return NextResponse.json(
                { error: 'Not enrolled in this course' },
                { status: 403 }
            );
        }

        // Get course units
        const units = await prisma.courseUnit.findMany({
            where: { courseId: params.courseId },
            orderBy: { order: 'asc' },
        });

        // Update last accessed
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { lastAccessedAt: new Date() },
        });

        return NextResponse.json({
            course: {
                id: course.id,
                code: course.code,
                title: course.title,
                description: course.description,
                image: course.image,
                introVideoUrl: course.introVideoUrl,
                timeLimit: course.timeLimit,
            },
            enrollment: {
                id: enrollment.id,
                status: enrollment.status,
                progress: enrollment.progress,
                startedAt: enrollment.startedAt,
                expiresAt: enrollment.expiresAt,
            },
            units: units.map((u, i) => ({
                id: u.id,
                title: u.title,
                type: u.type,
                order: u.order,
                isSample: u.isSample,
                content: u.content, // Full content for enrolled users
                isLocked: false, // TODO: Implement unit locking based on prerequisites
            })),
            totalUnits: units.length,
        });
    } catch (error) {
        console.error('Error fetching course player:', error);
        return NextResponse.json({ error: 'Failed to load course' }, { status: 500 });
    }
}

// POST complete a unit or update progress
export async function POST(
    request: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        const body = await request.json();
        const { userId, unitId, action } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: params.courseId } },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
        }

        // Get total units
        const totalUnits = await prisma.courseUnit.count({
            where: { courseId: params.courseId },
        });

        if (action === 'completeUnit' && unitId) {
            // Calculate new progress based on units completed
            // For simplicity, each unit = equal portion of progress
            const progressPerUnit = totalUnits > 0 ? 100 / totalUnits : 100;
            const newProgress = Math.min(100, enrollment.progress + progressPerUnit);

            const isComplete = newProgress >= 100;

            const updated = await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    progress: Math.round(newProgress),
                    status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
                    startedAt: enrollment.startedAt || new Date(),
                    lastAccessedAt: new Date(),
                    ...(isComplete && { completedAt: new Date() }),
                },
            });

            if (isComplete) {
                const course = await prisma.course.findUnique({
                    where: { id: params.courseId },
                });

                await prisma.timelineEvent.create({
                    data: {
                        userId,
                        courseId: params.courseId,
                        eventType: 'COURSE_COMPLETED',
                        details: { courseTitle: course?.title },
                    },
                });
            }

            return NextResponse.json({
                success: true,
                progress: updated.progress,
                status: updated.status,
                isComplete,
            });
        }

        if (action === 'start') {
            const updated = await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: enrollment.startedAt || new Date(),
                    lastAccessedAt: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                status: updated.status,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error updating course progress:', error);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
}
