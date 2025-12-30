import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET calendar events
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, startTime, endTime, type, color } = body;

        const event = await (prisma.calendarEvent as any).create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type: type || 'general',
                color: color || '#6B21A8',
                instructorId: session.userId,
            }
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
