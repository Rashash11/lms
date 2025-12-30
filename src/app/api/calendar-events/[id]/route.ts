import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT update calendar event
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, startTime, endTime, type, color } = body;

        // Verify ownership
        const existing = await (prisma.calendarEvent as any).findUnique({
            where: { id: params.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (existing.instructorId !== session.userId && session.activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const event = await (prisma.calendarEvent as any).update({
            where: { id: params.id },
            data: {
                title,
                description,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                type,
                color,
            }
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error('Error updating calendar event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

// DELETE calendar event
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const existing = await (prisma.calendarEvent as any).findUnique({
            where: { id: params.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (existing.instructorId !== session.userId && session.activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await (prisma.calendarEvent as any).delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
