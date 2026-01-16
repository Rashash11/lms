import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

// POST /api/admin/notifications/[id]/duplicate - Duplicate a notification
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { roles: ['ADMIN'] }, async (ctx) => {
        const { id } = await context.params;

        const original = await prisma.notification.findUnique({
            where: { id },
        });

        if (!original) {
            return apiError('Notification not found', 404);
        }

        try {
            const duplicate = await prisma.notification.create({
                data: {
                    name: `${original.name} (Copy)`,
                    eventKey: original.eventKey,
                    isActive: false, // Start as inactive
                    hoursOffset: original.hoursOffset,
                    offsetDirection: original.offsetDirection,
                    filterCourses: original.filterCourses,
                    filterGroups: original.filterGroups,
                    filterBranches: original.filterBranches,
                    recipientType: original.recipientType,
                    recipientUserId: original.recipientUserId,
                    messageSubject: original.messageSubject,
                    messageBody: original.messageBody,
                },
            });

            return apiResponse(duplicate, 201);
        } catch (error) {
            console.error('Error duplicating notification:', error);
            throw error;
        }
    });
}
