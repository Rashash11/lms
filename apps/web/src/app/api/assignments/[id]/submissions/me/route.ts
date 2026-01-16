
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

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
    // Basic auth check, no specific permission needed to see own submission
    return withGuard(request, {}, async (ctx) => {
        const { id: assignmentUnitId } = await context.params;
        const session = ctx.session;

        const submission = await prisma.assignmentSubmission.findFirst({
            where: {
                assignmentUnitId: assignmentUnitId,
                userId: session.userId
            }
        });

        if (!submission) {
            return apiError('No submission found', 404);
        }

        return apiResponse(submission);
    });
}
