import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/learner/certificates/[id]
 * Returns certificate details for the logged-in learner.
 * Enforces ownership - learner can only access their own certificates.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id: certificateId } = await context.params;

        const certificate = await prisma.certificateIssue.findUnique({
            where: {
                id: certificateId
            }
        });

        if (!certificate) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        // Ownership check - learner can only access their own certificates
        if (certificate.userId !== session.userId) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'You can only access your own certificates' },
                { status: 403 }
            );
        }

        return NextResponse.json(certificate);

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching certificate:', error);
        return NextResponse.json({ error: 'Failed to fetch certificate' }, { status: 500 });
    }
}
