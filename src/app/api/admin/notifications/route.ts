import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating/updating notifications
const notificationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    eventKey: z.string().min(1, 'Event type is required'),
    isActive: z.boolean().optional().default(true),
    hoursOffset: z.number().int().positive().optional().nullable(),
    offsetDirection: z.enum(['AFTER', 'BEFORE', 'SINCE']).optional().nullable(),
    filterCourses: z.array(z.string()).optional().default([]),
    filterGroups: z.array(z.string()).optional().default([]),
    filterBranches: z.array(z.string()).optional().default([]),
    recipientType: z.string().min(1, 'Recipient type is required'),
    recipientUserId: z.string().optional().nullable(),
    messageSubject: z.string().min(1, 'Subject is required'),
    messageBody: z.string().min(1, 'Message body is required'),
});

// GET /api/admin/notifications - List all notifications
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'overview';
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        if (tab === 'history') {
            // Return notification history
            const where: any = {};

            if (search) {
                where.OR = [
                    { recipientEmail: { contains: search, mode: 'insensitive' } },
                    { eventKey: { contains: search, mode: 'insensitive' } },
                ];
            }

            const [history, total] = await Promise.all([
                prisma.notificationHistory.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { sentAt: 'desc' },
                    include: {
                        notification: {
                            select: {
                                name: true,
                                eventKey: true,
                            },
                        },
                    },
                }),
                prisma.notificationHistory.count({ where }),
            ]);

            return NextResponse.json({
                data: history,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            });
        }

        if (tab === 'pending') {
            // Return pending notifications from queue
            const where: any = {
                status: 'PENDING',
            };

            if (search) {
                where.OR = [
                    { recipientEmail: { contains: search, mode: 'insensitive' } },
                ];
            }

            const [pending, total] = await Promise.all([
                prisma.notificationQueue.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { scheduledFor: 'asc' },
                    include: {
                        notification: {
                            select: {
                                name: true,
                                eventKey: true,
                            },
                        },
                    },
                }),
                prisma.notificationQueue.count({ where }),
            ]);

            return NextResponse.json({
                data: pending,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            });
        }

        // Default: overview tab - return notifications
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { eventKey: { contains: search, mode: 'insensitive' } },
                { messageSubject: { contains: search, mode: 'insensitive' } },
            ];
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
            data: notifications,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// POST /api/admin/notifications - Create new notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = notificationSchema.safeParse(body);
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
                isActive: data.isActive,
                hoursOffset: data.hoursOffset,
                offsetDirection: data.offsetDirection,
                filterCourses: data.filterCourses,
                filterGroups: data.filterGroups,
                filterBranches: data.filterBranches,
                recipientType: data.recipientType,
                recipientUserId: data.recipientUserId,
                messageSubject: data.messageSubject,
                messageBody: data.messageBody,
            },
        });

        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/notifications - Bulk delete
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'No notification IDs provided' },
                { status: 400 }
            );
        }

        const result = await prisma.notification.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting notifications:', error);
        return NextResponse.json(
            { error: 'Failed to delete notifications' },
            { status: 500 }
        );
    }
}
