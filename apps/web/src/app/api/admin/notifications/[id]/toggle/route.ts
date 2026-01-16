import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/notifications/[id]/toggle - Activate/deactivate notification
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { roles: ['ADMIN'] }, async (ctx) => {
        const { id } = await context.params;
        
        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            return apiError('Notification not found', 404);
        }

        try {
            const updated = await prisma.notification.update({
                where: { id },
                data: { isActive: !notification.isActive },
            });

            return apiResponse(updated);
        } catch (error) {
            console.error('Error toggling notification:', error);
            throw error;
        }
    });
}
