import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateAssignmentSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    courseId: z.string().optional().nullable(),
    dueAt: z.string().datetime().optional().nullable(),
});

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'assignment:read' }, async (ctx) => {
        const { id } = await context.params;
        const session = ctx.session;

        const assignment = await (prisma as any).assignment.findUnique({
            where: { id },
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
            return apiError('Not Found', 404);
        }

        // PERMISSION CHECK
        if (session.role === 'LEARNER') {
            // Course-based assignment: must be enrolled
            if (assignment.courseId) {
                const enrollment = await prisma.enrollment.findFirst({
                    where: {
                        tenantId: session.tenantId,
                        userId: session.userId,
                        courseId: assignment.courseId,
                    },
                });
                if (!enrollment) {
                    return apiError('FORBIDDEN: Not enrolled in this course', 403);
                }
            } else {
                // Non-course assignment: for now, only allow if session is not LEARNER or if we have another way to check
                return apiError('FORBIDDEN: This assignment is not linked to a course', 403);
            }
        }
        else if (session.role === 'INSTRUCTOR') {
            // Must manage course
            if (assignment.course) {
                const isManager = assignment.course.instructorId === session.userId ||
                    (assignment.course.instructors as any[]).some(i => i.userId === session.userId);
                if (!isManager) return apiError('FORBIDDEN', 403);
            } else if (assignment.createdBy !== session.userId) {
                // Orphaned assignment, only creator or admin can see
                return apiError('FORBIDDEN', 403);
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

        return apiResponse({
            ...assignment,
            submission: userSubmission
        });
    });
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'assignment:update' }, async (ctx) => {
        const { id } = await context.params;
        const session = ctx.session;

        const assignment = await (prisma as any).assignment.findUnique({
            where: { id },
            include: {
                course: { include: { instructors: true } }
            }
        });

        if (!assignment) {
            return apiError('Not Found', 404);
        }

        // Instructor Permission Check
        if (session.role === 'INSTRUCTOR') {
            if (assignment.course) {
                const isManager = assignment.course.instructorId === session.userId ||
                    assignment.course.instructors.some(i => i.userId === session.userId);
                if (!isManager) return apiError('FORBIDDEN', 403);
            } else if (assignment.createdBy !== session.userId) {
                return apiError('FORBIDDEN', 403);
            }
        }

        const body = await request.json();
        const validation = updateAssignmentSchema.safeParse(body);

        if (!validation.success) {
            return apiError(validation.error.errors[0].message, 400);
        }

        const { title, description, courseId, dueAt } = validation.data;

        try {
            const updatedAssignment = await (prisma as any).assignment.update({
                where: { id },
                data: {
                    title,
                    description,
                    courseId,
                    dueAt: dueAt ? new Date(dueAt) : null,
                },
            });

            return apiResponse(updatedAssignment);
        } catch (error) {
            console.error('Error updating assignment:', error);
            throw error;
        }
    });
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'assignment:delete' }, async (ctx) => {
        const { id } = await context.params;
        
        try {
            await (prisma as any).assignment.delete({
                where: { id },
            });

            return apiResponse({ success: true });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return apiError('Assignment not found', 404);
            }
            console.error('Error deleting assignment:', error);
            throw error;
        }
    });
}
