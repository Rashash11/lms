import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const updateNotificationSchema = z.object({
    name: z.string().min(1).optional(),
    eventType: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    rulesets: z.record(z.any()).optional(),
    smartTags: z.array(z.string()).optional(),
    isRecurring: z.boolean().optional(),
    recurringConfig: z.record(z.any()).nullable().optional(),
    isActive: z.boolean().optional(),
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
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error fetching notification:', error);
        return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 });
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
                ...(data.eventType !== undefined && { eventType: data.eventType }),
                ...(data.subject !== undefined && { subject: data.subject }),
                ...(data.body !== undefined && { body: data.body }),
                ...(data.rulesets !== undefined && { rulesets: data.rulesets }),
                ...(data.smartTags !== undefined && { smartTags: data.smartTags }),
                ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
                ...(data.recurringConfig !== undefined && { recurringConfig: data.recurringConfig === null ? Prisma.DbNull : data.recurringConfig }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
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
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}

// PATCH toggle isActive or send preview
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { action, previewEmail } = body;

        if (action === 'toggle') {
            const notification = await prisma.notification.findUnique({
                where: { id: params.id },
            });

            if (!notification) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            const updated = await prisma.notification.update({
                where: { id: params.id },
                data: { isActive: !notification.isActive },
            });

            return NextResponse.json(updated);
        }

        if (action === 'preview' && previewEmail) {
            // TODO: Implement email preview sending
            console.log(`Preview email would be sent to: ${previewEmail}`);
            return NextResponse.json({
                success: true,
                message: `Preview sent to ${previewEmail}`
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error patching notification:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}
