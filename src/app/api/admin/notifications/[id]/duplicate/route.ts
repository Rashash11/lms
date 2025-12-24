import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/notifications/[id]/duplicate - Duplicate a notification
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const original = await prisma.notification.findUnique({
            where: { id: params.id },
        });

        if (!original) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

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

        return NextResponse.json(duplicate, { status: 201 });
    } catch (error) {
        console.error('Error duplicating notification:', error);
        return NextResponse.json(
            { error: 'Failed to duplicate notification' },
            { status: 500 }
        );
    }
}
