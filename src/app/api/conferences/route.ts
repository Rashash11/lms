import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all conferences for the current instructor
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conferences = await prisma.conference.findMany({
            where: {
                instructorId: session.userId
            },
            orderBy: { startTime: 'asc' }
        });

        return NextResponse.json(conferences);
    } catch (error) {
        console.error('Error fetching conferences:', error);
        return NextResponse.json({ error: 'Failed to fetch conferences' }, { status: 500 });
    }
}

// POST create a new conference
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, startTime, endTime, duration } = body;

        const conference = await prisma.conference.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration: duration || 60,
                instructorId: session.userId,
            }
        });

        // Also create a calendar event
        await prisma.calendarEvent.create({
            data: {
                title: `Conference: ${title}`,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type: 'conference',
                instructorId: session.userId,
            }
        });

        return NextResponse.json(conference, { status: 201 });
    } catch (error) {
        console.error('Error creating conference:', error);
        return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 });
    }
}
