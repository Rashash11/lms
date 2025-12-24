import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/notifications/pending/[queueId]/cancel - Cancel a pending notification
export async function POST(
    request: NextRequest,
    { params }: { params: { queueId: string } }
) {
    try {
        const queueItem = await prisma.notificationQueue.findUnique({
            where: { id: params.queueId },
        });

        if (!queueItem) {
            return NextResponse.json(
                { error: 'Queued notification not found' },
                { status: 404 }
            );
        }

        if (queueItem.status !== 'PENDING') {
            return NextResponse.json(
                { error: `Cannot cancel notification with status: ${queueItem.status}` },
                { status: 400 }
            );
        }

        const updated = await prisma.notificationQueue.update({
            where: { id: params.queueId },
            data: {
                status: 'CANCELED',
                processedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            queueItem: updated,
        });
    } catch (error) {
        console.error('Error canceling pending notification:', error);
        return NextResponse.json(
            { error: 'Failed to cancel pending notification' },
            { status: 500 }
        );
    }
}
