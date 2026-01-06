import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/learner/certificates/[id]/download
 * Downloads certificate PDF (MVP: returns placeholder URL).
 * Enforces ownership - learner can only download their own certificates.
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

        // Ownership check
        if (certificate.userId !== session.userId) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'You can only download your own certificates' },
                { status: 403 }
            );
        }

        // MVP: Return certificate data with placeholder download URL
        // Future: Generate PDF using template and return file
        return NextResponse.json({
            certificateId: certificate.id,
            userId: certificate.userId,
            courseId: certificate.courseId,
            templateId: certificate.templateId,
            issuedAt: certificate.issuedAt,
            downloadUrl: null, // MVP: placeholder
            message: 'PDF generation not yet implemented. Use certificate data to display in UI.'
        });

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error downloading certificate:', error);
        return NextResponse.json({ error: 'Failed to download certificate' }, { status: 500 });
    }
}
