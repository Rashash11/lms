import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';


export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'submission:read' }, async () => {

    try {
        const session = await requireAuth();
        const { id } = await context.params;

        if (!(await can(session, 'submission:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: submission:read' }, { status: 403 });
        }

        const submission = await prisma.assignmentSubmission.findFirst({
            where: { tenantId: session.tenantId, id },
            include: {
                course: { select: { id: true, title: true } },
                file: { select: { id: true, filename: true, mimeType: true, filesize: true, externalUrl: true } },
            },
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        const [user, unit] = await Promise.all([
            prisma.user.findFirst({
                where: { tenantId: session.tenantId, id: submission.userId },
                select: { id: true, firstName: true, lastName: true, email: true },
            }),
            prisma.courseUnit.findFirst({
                where: { tenantId: session.tenantId, id: submission.assignmentUnitId },
                select: { id: true, title: true },
            }),
        ]);

        // Permission check: Only allow instructor/admin to view
        if (session.activeRole === 'LEARNER' && submission.userId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            ...submission,
            user: user || null,
            assignment: unit ? { id: unit.id, title: unit.title } : null,
        });
    } catch (error: any) {
        // Handle potential invalid ID (UUID) error from Prisma
        if (error.code === 'P2023') { // Inconsistent column data (e.g. invalid UUID)
             return NextResponse.json({ error: 'Submission not found (Invalid ID)' }, { status: 404 });
        }
        console.error('Error fetching submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    });
}
