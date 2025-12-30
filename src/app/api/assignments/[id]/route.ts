import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    courseId: z.string().optional().nullable(),
    dueAt: z.string().datetime().optional().nullable(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();

        const assignment = await prisma.assignment.findUnique({
            where: { id: params.id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        code: true,
                        instructorId: true,
                        instructors: { select: { userId: true } }
                    }
                }
            },
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        // PERMISSION CHECK
        if (session.activeRole === 'LEARNER') {
            // Check if learner can view this assignment
            if (assignment.courseId) {
                // Course-based assignment: must be enrolled
                const enrollment = await prisma.enrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId: session.userId,
                            courseId: assignment.courseId
                        }
                    }
                });
                if (!enrollment) {
                    return NextResponse.json({ error: 'FORBIDDEN: Not enrolled in this course' }, { status: 403 });
                }

                // Also check if assignment is learner-specific
                const assignedLearners = await prisma.assignmentLearner.findMany({
                    where: { assignmentId: assignment.id }
                });

                // If there are assigned learners, check if this learner is one of them
                if (assignedLearners.length > 0) {
                    const isAssigned = assignedLearners.some(al => al.userId === session.userId);
                    if (!isAssigned) {
                        return NextResponse.json({ error: 'FORBIDDEN: Not assigned to this assignment' }, { status: 403 });
                    }
                }
            } else {
                // Non-course assignment: must be specifically assigned
                const isAssigned = await prisma.assignmentLearner.findFirst({
                    where: {
                        assignmentId: assignment.id,
                        userId: session.userId
                    }
                });

                if (!isAssigned) {
                    return NextResponse.json({ error: 'FORBIDDEN: Not assigned to this assignment' }, { status: 403 });
                }
            }
        }
        else if (session.activeRole === 'INSTRUCTOR') {
            // Must manage course
            if (assignment.course) {
                const isManager = assignment.course.instructorId === session.userId ||
                    assignment.course.instructors.some(i => i.userId === session.userId);
                if (!isManager) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            } else if (assignment.createdBy !== session.userId) {
                // Orphaned assignment, only creator or admin can see
                return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            }
        }

        // If learner, include their submission
        let userSubmission = null;
        if (session.activeRole === 'LEARNER') {
            userSubmission = await (prisma.assignmentSubmission as any).findFirst({
                where: {
                    assignmentId: assignment.id,
                    userId: session.userId
                }
            });
        }

        return NextResponse.json({
            ...assignment,
            submission: userSubmission
        });
    } catch (error) {
        console.error('Error fetching assignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();

        // Learner cannot update
        if (session.activeRole === 'LEARNER') {
            return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id: params.id },
            include: {
                course: { include: { instructors: true } }
            }
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        // Instructor Permission Check
        if (session.activeRole === 'INSTRUCTOR') {
            if (assignment.course) {
                const isManager = assignment.course.instructorId === session.userId ||
                    assignment.course.instructors.some(i => i.userId === session.userId);
                if (!isManager) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            } else if (assignment.createdBy !== session.userId) {
                return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            }
        }

        const body = await request.json();
        const validation = updateAssignmentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const { title, description, courseId, dueAt } = validation.data;

        const updatedAssignment = await prisma.assignment.update({
            where: { id: params.id },
            data: {
                title,
                description,
                courseId,
                dueAt: dueAt ? new Date(dueAt) : null,
            },
        });

        return NextResponse.json(updatedAssignment);
    } catch (error) {
        console.error('Error updating assignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();

        // ONLY ADMIN AND SUPER_INSTRUCTOR CAN DELETE (Instructor cannot delete permanently)
        if (session.activeRole !== 'ADMIN' && session.activeRole !== 'SUPER_INSTRUCTOR') {
            return NextResponse.json({ error: 'FORBIDDEN: Only Admins can delete assignments' }, { status: 403 });
        }

        await prisma.assignment.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
