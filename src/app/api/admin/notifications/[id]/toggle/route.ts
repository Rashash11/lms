import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/notifications/[id]/toggle - Activate/deactivate notification
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: params.id },
        });

        if (!notification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        const updated = await prisma.notification.update({
            where: { id: params.id },
            data: { isActive: !notification.isActive },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error toggling notification:', error);
        return NextResponse.json(
            { error: 'Failed to toggle notification' },
            { status: 500 }
        );
    }
}
