import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthError } from '@/lib/auth';
import { can } from '@/lib/permissions';

// GET submissions for grading
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'submission:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', message: 'Missing permission: submission:read' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'PENDING';

        const where: any = {
            status: status
        };

        // ROLE-BASED ACCESS CONTROL
        if (session.role === 'LEARNER') {
            // Learner can only see their own submissions
            where.userId = session.userId;
        }
        // ADMIN / SUPER_INSTRUCTOR / INSTRUCTOR can see all for now
        // (Could add instructor filtering by courseId if needed)

        // AssignmentSubmission has no relations, just FK columns
        const submissions = await prisma.assignmentSubmission.findMany({
            where,
            orderBy: { submittedAt: 'desc' },
            take: 100,
        });

        return NextResponse.json(submissions);
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: 'UNAUTHORIZED', message: error.message }, { status: error.statusCode });
        }
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch submissions' }, { status: 500 });
    }
}

// POST - Create a new submission (learner submits)
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'submission:create'))) {
            return NextResponse.json({ error: 'FORBIDDEN', message: 'Missing permission: submission:create' }, { status: 403 });
        }

        const body = await request.json();
        const { assignmentUnitId, courseId, content, fileId, submissionType } = body;

        if (!assignmentUnitId || !courseId) {
            return NextResponse.json({ error: 'BAD_REQUEST', message: 'assignmentUnitId and courseId are required' }, { status: 400 });
        }

        const submission = await prisma.assignmentSubmission.create({
            data: {
                assignmentUnitId,
                userId: session.userId,
                courseId,
                content: content || null,
                fileId: fileId || null,
                submissionType: submissionType || 'text',
                status: 'PENDING',
            },
        });

        return NextResponse.json(submission, { status: 201 });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: 'UNAUTHORIZED', message: error.message }, { status: error.statusCode });
        }
        console.error('Error creating submission:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to create submission' }, { status: 500 });
    }
}

// PATCH - Grade a submission
export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'submission:grade'))) {
            return NextResponse.json({ error: 'FORBIDDEN', message: 'Missing permission: submission:grade' }, { status: 403 });
        }

        const body = await request.json();
        const { id, score, comment, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'BAD_REQUEST', message: 'Submission id is required' }, { status: 400 });
        }

        const existing = await prisma.assignmentSubmission.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'NOT_FOUND', message: 'Submission not found' }, { status: 404 });
        }

        const updated = await prisma.assignmentSubmission.update({
            where: { id },
            data: {
                score: score ?? existing.score,
                comment: comment ?? existing.comment,
                status: status || 'GRADED',
                gradedAt: new Date(),
                gradedBy: session.userId,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: 'UNAUTHORIZED', message: error.message }, { status: error.statusCode });
        }
        console.error('Error grading submission:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to grade submission' }, { status: 500 });
    }
}
