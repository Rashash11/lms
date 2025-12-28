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
        const search = searchParams.get('search') || '';
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const conferences = await prisma.conference.findMany({
            where: {
                instructorId: session.userId,
                ...(search ? {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                } : {}),
                ...(from ? { startTime: { gte: new Date(from) } } : {}),
                ...(to ? { endTime: { lte: new Date(to) } } : {})
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return NextResponse.json({ conferences });
    } catch (error) {
        console.error('Error fetching conferences:', error);
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
        const { title, description, startTime, endTime, duration, meetingUrl } = body;

        const conference = await prisma.conference.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration,
                meetingUrl,
                instructorId: session.userId
            }
        });

        return NextResponse.json({ success: true, conference });
    } catch (error) {
        console.error('Error creating conference:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
