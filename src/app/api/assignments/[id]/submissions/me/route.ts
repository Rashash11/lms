
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/assignments/[id]/submissions/me
 * Returns the current user's submission for a specific assignment.
 * 
 * Note: [id] should be the assignmentUnitId.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id: assignmentUnitId } = await context.params;

        const submission = await prisma.assignmentSubmission.findFirst({
            where: {
                assignmentUnitId: assignmentUnitId,
                userId: session.userId
            }
        });

        if (!submission) {
            return NextResponse.json({ error: 'No submission found' }, { status: 404 });
        }

        return NextResponse.json(submission);
    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching own submission:', error);
        return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
    }
}
