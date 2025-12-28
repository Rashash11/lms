import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single enrollment with course details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: params.id },
            include: {
                course: true,
            },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        // Get course units for progress tracking
        const units = await prisma.courseUnit.findMany({
            where: { courseId: enrollment.courseId },
            orderBy: { order_index: 'asc' },
            select: {
                id: true,
                title: true,
                type: true,
                order_index: true,
            }
        });

        // Get completed unit IDs from TimelineEvents
        const completions = await prisma.timelineEvent.findMany({
            where: {
                userId: enrollment.userId,
                courseId: enrollment.courseId,
                eventType: 'UNIT_COMPLETED',
            },
            select: { details: true }
        });

        const completedUnitIds = completions.map((c: any) => c.details.unitId);

        return NextResponse.json({
            ...enrollment,
            units,
            unitCount: units.length,
            completedUnitIds,
        });
    } catch (error) {
        console.error('Error fetching enrollment:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollment' }, { status: 500 });
    }
}

// PUT update enrollment (progress, status)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { progress, status, score } = body;

        const updateData: any = { lastAccessedAt: new Date() };

        if (progress !== undefined) {
            updateData.progress = Math.min(100, Math.max(0, progress));
        }

        if (status !== undefined) {
            updateData.status = status;

            // Set timestamps based on status
            if (status === 'IN_PROGRESS' && !updateData.startedAt) {
                const current = await prisma.enrollment.findUnique({
                    where: { id: params.id },
                });
                if (!current?.startedAt) {
                    updateData.startedAt = new Date();
                }
            }

            if (status === 'COMPLETED') {
                updateData.completedAt = new Date();
                updateData.progress = 100;
            }
        }

        if (score !== undefined) {
            updateData.score = score;
        }

        const enrollment = await prisma.enrollment.update({
            where: { id: params.id },
            data: updateData,
            include: { course: true },
        });

        // Log completion event
        if (status === 'COMPLETED') {
            await prisma.timelineEvent.create({
                data: {
                    userId: enrollment.userId,
                    courseId: enrollment.courseId,
                    eventType: 'COURSE_COMPLETED',
                    details: {
                        courseTitle: enrollment.course.title,
                        score: score || null,
                    },
                },
            });
        }

        return NextResponse.json(enrollment);
    } catch (error) {
        console.error('Error updating enrollment:', error);
        return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
    }
}

// DELETE unenroll
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: params.id },
            include: { course: true },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await prisma.enrollment.delete({
            where: { id: params.id },
        });

        // Log unenroll event
        await prisma.timelineEvent.create({
            data: {
                userId: enrollment.userId,
                courseId: enrollment.courseId,
                eventType: 'COURSE_UNENROLLED',
                details: { courseTitle: enrollment.course.title },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        return NextResponse.json({ error: 'Failed to unenroll' }, { status: 500 });
    }
}

// PATCH update progress/mark complete
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { action, unitId, progress: progressIncrement } = body;

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: params.id },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (action === 'start') {
            const updated = await prisma.enrollment.update({
                where: { id: params.id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: enrollment.startedAt || new Date(),
                    lastAccessedAt: new Date(),
                },
            });
            return NextResponse.json(updated);
        }

        if (action === 'complete') {
            const updated = await prisma.enrollment.update({
                where: { id: params.id },
                data: {
                    status: 'COMPLETED',
                    progress: 100,
                    completedAt: new Date(),
                    lastAccessedAt: new Date(),
                },
            });
            return NextResponse.json(updated);
        }

        if (action === 'completeUnit' && unitId) {
            // Check if already completed
            const existing = await prisma.timelineEvent.findFirst({
                where: {
                    userId: enrollment.userId,
                    courseId: enrollment.courseId,
                    eventType: 'UNIT_COMPLETED',
                    details: { path: ['unitId'], equals: unitId }
                }
            });

            if (!existing) {
                await prisma.timelineEvent.create({
                    data: {
                        userId: enrollment.userId,
                        courseId: enrollment.courseId,
                        eventType: 'UNIT_COMPLETED',
                        details: { unitId },
                    },
                });
            }

            // Recalculate progress
            const allUnits = await prisma.courseUnit.findMany({
                where: { courseId: enrollment.courseId },
                select: { id: true }
            });

            const allCompletions = await prisma.timelineEvent.findMany({
                where: {
                    userId: enrollment.userId,
                    courseId: enrollment.courseId,
                    eventType: 'UNIT_COMPLETED',
                },
                select: { details: true }
            });

            const completedIds = new Set(allCompletions.map((c: any) => c.details.unitId));
            const totalUnits = allUnits.length || 1;
            const completedCount = allUnits.filter(u => completedIds.has(u.id)).length;
            const newProgress = Math.round((completedCount / totalUnits) * 100);

            const updated = await prisma.enrollment.update({
                where: { id: params.id },
                data: {
                    progress: newProgress,
                    status: newProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
                    lastAccessedAt: new Date(),
                    ...(newProgress >= 100 && !enrollment.completedAt && { completedAt: new Date() }),
                },
            });
            return NextResponse.json({ ...updated, completedUnitIds: Array.from(completedIds) });
        }

        if (action === 'incrementProgress' && progressIncrement) {
            const newProgress = Math.min(100, enrollment.progress + progressIncrement);
            const updated = await prisma.enrollment.update({
                where: { id: params.id },
                data: {
                    progress: newProgress,
                    status: newProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
                    lastAccessedAt: new Date(),
                    ...(newProgress >= 100 && { completedAt: new Date() }),
                },
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error patching enrollment:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
