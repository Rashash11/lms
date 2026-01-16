import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

// POST /api/admin/notifications/pending/[queueId]/cancel - Cancel a pending notification
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ queueId: string }> }
) {
    return withGuard(request, { roles: ['ADMIN'] }, async (ctx) => {
        const { queueId } = await context.params;

        const queueItem = await prisma.notificationQueue.findUnique({
            where: { id: queueId },
        });

        if (!queueItem) {
            return apiError('Queued notification not found', 404);
        }

        if (queueItem.status !== 'PENDING') {
            return apiError(`Cannot cancel notification with status: ${queueItem.status}`, 400);
        }

        try {
            const updated = await prisma.notificationQueue.update({
                where: { id: queueId },
                data: {
                    status: 'CANCELED',
                    processedAt: new Date(),
                },
            });

            return apiResponse({
                success: true,
                queueItem: updated,
            });
        } catch (error) {
            console.error('Error canceling pending notification:', error);
            throw error;
        }
    });
}
