import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activeRole = session.activeRole;
        if (activeRole !== 'INSTRUCTOR' && activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        const events = await prisma.calendarEvent.findMany({
            where: {
                instructorId: session.userId,
                ...(start ? { startTime: { gte: new Date(start) } } : {}),
                ...(end ? { endTime: { lte: new Date(end) } } : {})
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activeRole = session.activeRole;
        if (activeRole !== 'INSTRUCTOR' && activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, startTime, endTime, type } = body;

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type: type || 'custom',
                instructorId: session.userId
            }
        });

        return NextResponse.json({ success: true, event });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
