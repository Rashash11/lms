import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createNotificationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    eventKey: z.string().min(1, 'Event key is required'),
    messageSubject: z.string().min(1, 'Subject is required'),
    messageBody: z.string().min(1, 'Body is required'),
    hoursOffset: z.number().nullable().optional(),
    offsetDirection: z.string().nullable().optional(),
    filterCourses: z.array(z.string()).optional(),
    filterGroups: z.array(z.string()).optional(),
    filterBranches: z.array(z.string()).optional(),
    recipientType: z.string().min(1, 'Recipient type is required'),
    recipientUserId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});

// GET all notifications
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const eventKey = searchParams.get('eventKey') || '';
        const isActive = searchParams.get('isActive');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { messageSubject: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (eventKey) {
            where.eventKey = eventKey;
        }

        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({ where }),
        ]);

        return NextResponse.json({
            notifications,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// POST create notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createNotificationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        const notification = await prisma.notification.create({
            data: {
                name: data.name,
                eventKey: data.eventKey,
                messageSubject: data.messageSubject,
                messageBody: data.messageBody,
                hoursOffset: data.hoursOffset,
                offsetDirection: data.offsetDirection,
                filterCourses: data.filterCourses || [],
                filterGroups: data.filterGroups || [],
                filterBranches: data.filterBranches || [],
                recipientType: data.recipientType,
                recipientUserId: data.recipientUserId,
                isActive: data.isActive ?? true,
            },
        });

        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}

// DELETE bulk delete
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 });
        }

        const result = await prisma.notification.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting notifications:', error);
        return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
    }
}

// PATCH bulk enable/disable
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, isActive } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 });
        }

        const result = await prisma.notification.updateMany({
            where: { id: { in: ids } },
            data: { isActive: isActive ?? true },
        });

        return NextResponse.json({ success: true, updated: result.count });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
