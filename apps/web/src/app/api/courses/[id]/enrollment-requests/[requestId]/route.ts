import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST approve enrollment request
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; requestId: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        // Find the request
        const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
            where: { id: params.requestId },
        });

        if (!enrollmentRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // Create enrollment
        await prisma.enrollment.create({
            data: {
                userId: enrollmentRequest.userId,
                courseId: params.id,
                status: 'NOT_STARTED',
                progress: 0,
            },
        });

        // Update request status
        await prisma.enrollmentRequest.update({
            where: { id: params.requestId },
            data: {
                status: 'approved',
                resolvedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error approving enrollment request:', error);
        return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
    }

    });
}

// DELETE decline enrollment request
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; requestId: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        await prisma.enrollmentRequest.update({
            where: { id: params.requestId },
            data: {
                status: 'declined', // User requested 'deny', DB uses 'declined' currently
                resolvedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error declining enrollment request:', error);
        return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 });
    }

    });
}
