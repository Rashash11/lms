
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const submissionSchema = z.object({
    content: z.string().optional()
});

/**
 * POST /api/assignments/[id]/submissions
 * Creates or updates a submission for the logged-in learner.
 * 
 * Note: [id] should be the assignmentUnitId (not the parent Assignment id).
 * AssignmentSubmission uses assignmentUnitId as the foreign key.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'submission:create' }, async (ctx) => {
        const { id: assignmentUnitId } = await context.params;
        const session = ctx.session;

        const body = await request.json();
        const validation = submissionSchema.safeParse(body);
        
        if (!validation.success) {
            return apiError('Validation failed', 400);
        }
        
        const { content } = validation.data;

        // Validate that assignment unit exists (assignments table, not assignment_units)
        // In this LMS, "assignments" table entries ARE the assignment units
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentUnitId },
            select: { id: true, courseId: true, dueAt: true }
        });

        if (!assignment) {
            return apiError('Assignment not found', 404);
        }

        // Validate enrollment
        if (assignment.courseId) {
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: session.userId,
                    courseId: assignment.courseId
                }
            });

            if (!enrollment) {
                return apiError('Not enrolled in this course', 403);
            }
        }

        // Check due date (prevent submissions after deadline)
        if (assignment.dueAt && new Date(assignment.dueAt) < new Date()) {
            return apiError('Assignment deadline has passed. Submissions are no longer accepted.', 403);
        }

        // Check if submission already exists
        const existingSubmission = await prisma.assignmentSubmission.findFirst({
            where: {
                assignmentUnitId: assignmentUnitId,
                userId: session.userId
            }
        });

        if (existingSubmission) {
            // Update existing submission
            const updated = await prisma.assignmentSubmission.update({
                where: { id: existingSubmission.id },
                data: {
                    content: content || existingSubmission.content,
                    submittedAt: new Date(),
                    status: 'SUBMITTED'
                }
            });
            return apiResponse(updated, 200);
        } else {
            // Create new submission
            const created = await prisma.assignmentSubmission.create({
                data: {
                    tenantId: session.tenantId,
                    userId: session.userId,
                    assignmentUnitId: assignmentUnitId,
                    courseId: assignment.courseId || '',
                    content: content || null,
                    submissionType: 'TEXT',
                    status: 'SUBMITTED',
                    submittedAt: new Date(),
                    maxScore: 100
                }
            });
            return apiResponse(created, 201);
        }
    });
}
