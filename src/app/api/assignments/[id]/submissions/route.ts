
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

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
    try {
        const session = await requireAuth();
        const { id: assignmentUnitId } = await context.params;

        if (!(await can(session, 'submission:create'))) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Missing permission: submission:create' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { content } = body;

        // Validate that assignment unit exists (assignments table, not assignment_units)
        // In this LMS, "assignments" table entries ARE the assignment units
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentUnitId },
            select: { id: true, courseId: true, dueAt: true }
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        // Validate enrollment
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
                return NextResponse.json(
                    { error: 'Not enrolled in this course' },
                    { status: 403 }
                );
            }
        }

        // Check due date (prevent submissions after deadline)
        if (assignment.dueAt && new Date(assignment.dueAt) < new Date()) {
            return NextResponse.json(
                { error: 'Assignment deadline has passed. Submissions are no longer accepted.' },
                { status: 403 }
            );
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
            return NextResponse.json(updated, { status: 200 });
        } else {
            // Create new submission
            const created = await prisma.assignmentSubmission.create({
                data: {
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
            return NextResponse.json(created, { status: 201 });
        }
    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Permission errors - return 403
        if (error?.statusCode === 403) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: error.message || 'Insufficient permissions' },
                { status: 403 }
            );
        }

        console.error('Error creating assignment submission:', error);
        return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
    }
}
