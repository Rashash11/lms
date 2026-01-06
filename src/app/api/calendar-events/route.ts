import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

// GET calendar events
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'calendar:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: calendar:read' }, { status: 403 });
        }

        const events = await prisma.calendarEvent.findMany({
            where: {
                OR: [
                    { instructorId: session.userId },
                    { type: 'course' }, // Global course events
                ]
            }
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

// POST create calendar event
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'calendar:create'))) {
            return NextResponse.json({ error: 'FORBIDDEN', message: 'Missing permission: calendar:create' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, startTime, endTime, type } = body;

        if (!title || !startTime || !endTime) {
            return NextResponse.json({ error: 'BAD_REQUEST', message: 'title, startTime, and endTime are required' }, { status: 400 });
        }

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description: description || null,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type: type || 'general',
                instructorId: session.userId,
            }
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to create event' }, { status: 500 });
    }
}
