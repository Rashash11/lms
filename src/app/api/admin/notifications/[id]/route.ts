import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateNotificationSchema = z.object({
    name: z.string().min(1).optional(),
    eventKey: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    hoursOffset: z.number().int().positive().optional().nullable(),
    offsetDirection: z.enum(['AFTER', 'BEFORE', 'SINCE']).optional().nullable(),
    filterCourses: z.array(z.string()).optional(),
    filterGroups: z.array(z.string()).optional(),
    filterBranches: z.array(z.string()).optional(),
    recipientType: z.string().min(1).optional(),
    recipientUserId: z.string().optional().nullable(),
    messageSubject: z.string().min(1).optional(),
    messageBody: z.string().min(1).optional(),
});

// GET single notification
export async function GET(
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

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error fetching notification:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notification' },
            { status: 500 }
        );
    }
}

// PUT update notification
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = updateNotificationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        const notification = await prisma.notification.update({
            where: { id: params.id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.eventKey !== undefined && { eventKey: data.eventKey }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.hoursOffset !== undefined && { hoursOffset: data.hoursOffset }),
                ...(data.offsetDirection !== undefined && { offsetDirection: data.offsetDirection }),
                ...(data.filterCourses !== undefined && { filterCourses: data.filterCourses }),
                ...(data.filterGroups !== undefined && { filterGroups: data.filterGroups }),
                ...(data.filterBranches !== undefined && { filterBranches: data.filterBranches }),
                ...(data.recipientType !== undefined && { recipientType: data.recipientType }),
                ...(data.recipientUserId !== undefined && { recipientUserId: data.recipientUserId }),
                ...(data.messageSubject !== undefined && { messageSubject: data.messageSubject }),
                ...(data.messageBody !== undefined && { messageBody: data.messageBody }),
            },
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}

// DELETE notification
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.notification.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: 500 }
        );
    }
}
