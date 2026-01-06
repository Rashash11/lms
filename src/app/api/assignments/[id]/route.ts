import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { can } from '@/lib/permissions';

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
        if (!(await can(session, 'assignment:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: assignment:read' }, { status: 403 });
        }

        const assignment = await (prisma as any).assignment.findUnique({
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
        if (session.role === 'LEARNER') {
            // Course-based assignment: must be enrolled
            if (assignment.courseId) {
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
            } else {
                // Non-course assignment: for now, only allow if session is not LEARNER or if we have another way to check
                // Since assignmentLearner table is missing, we'll restrict to course assignments for learners
                return NextResponse.json({ error: 'FORBIDDEN: This assignment is not linked to a course' }, { status: 403 });
            }
        }
        else if (session.role === 'INSTRUCTOR') {
            // Must manage course
            if (assignment.course) {
                const isManager = assignment.course.instructorId === session.userId ||
                    (assignment.course.instructors as any[]).some(i => i.userId === session.userId);
                if (!isManager) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            } else if (assignment.createdBy !== session.userId) {
                // Orphaned assignment, only creator or admin can see
                return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            }
        }

        // If learner, include their submission
        let userSubmission = null;
        if (session.role === 'LEARNER') {
            // Note: AssignmentSubmission uses assignmentUnitId, but we might be using it differently here
            // We'll check for submissions related to this assignment ID if possible
            // But AssignmentSubmission model doesn't have assignmentId.
            // For now, return null as we need to fix the submission model later.
            userSubmission = null;
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

        if (!(await can(session, 'assignment:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: assignment:update' }, { status: 403 });
        }

        const assignment = await (prisma as any).assignment.findUnique({
            where: { id: params.id },
            include: {
                course: { include: { instructors: true } }
            }
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        // Instructor Permission Check
        if (session.role === 'INSTRUCTOR') {
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

        const updatedAssignment = await (prisma as any).assignment.update({
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

        if (!(await can(session, 'assignment:delete'))) {
            return NextResponse.json({ error: 'FORBIDDEN: Only creators, super instructors and admins can delete assignments' }, { status: 403 });
        }

        await (prisma as any).assignment.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
