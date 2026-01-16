import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic';
/**
 * GET /api/learner/certificates
 * Returns all certificates issued to the logged-in learner.
 */
const GET_handler = async (request: NextRequest) => {
    try {
        const session = await requireAuth();

        const certificates = await prisma.certificateIssue.findMany({
            where: {
                userId: session.userId
            },
            orderBy: {
                issuedAt: 'desc'
            }
        });

        return NextResponse.json(certificates);

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching certificates:', error);
        return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
    }
}
export async function GET(request: NextRequest) {
    return withGuard(request, { roles: ['LEARNER'] }, () => GET_handler(request));
}
