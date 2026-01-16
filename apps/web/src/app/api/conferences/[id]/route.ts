import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

// GET single conference

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const session = await requireAuth();
        if (!(await can(session, 'conference:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: conference:read' }, { status: 403 });
        }

        const conference = await (prisma.conference as any).findUnique({
            where: { id: params.id },
            include: {
                instructor: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        if (!conference) {
            return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
        }

        return NextResponse.json(conference);
    } catch (error) {
        console.error('Error fetching conference:', error);
        return NextResponse.json({ error: 'Failed to fetch conference' }, { status: 500 });
    }

    });
}

// PUT update conference
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const session = await requireAuth();
        if (!(await can(session, 'conference:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: conference:update' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, startTime, endTime, duration, meetingUrl, color } = body;

        // Verify ownership
        const existing = await (prisma.conference as any).findUnique({
            where: { id: params.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
        }

        if (existing.instructorId !== session.userId && session.activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const conference = await (prisma.conference as any).update({
            where: { id: params.id },
            data: {
                title,
                description,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                duration: duration ? parseInt(duration) : undefined,
                meetingUrl,
                color,
            }
        });

        // Sync with calendar event if it exists
        // Assuming calendar event for a conference has the same title and starts at the same time
        // This is a simplified sync logic
        const calEvent = await (prisma.calendarEvent as any).findFirst({
            where: {
                title: existing.title,
                startTime: existing.startTime,
                instructorId: existing.instructorId,
                type: 'conference'
            }
        });

        if (calEvent) {
            await (prisma.calendarEvent as any).update({
                where: { id: calEvent.id },
                data: {
                    title: title || conference.title,
                    description: description || conference.description,
                    startTime: conference.startTime,
                    endTime: conference.endTime,
                    color: color || conference.color
                }
            });
        }

        return NextResponse.json(conference);
    } catch (error) {
        console.error('Error updating conference:', error);
        return NextResponse.json({ error: 'Failed to update conference' }, { status: 500 });
    }

    });
}

// DELETE conference
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const session = await requireAuth();
        if (!(await can(session, 'conference:delete'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: conference:delete' }, { status: 403 });
        }

        // Verify ownership
        const existing = await (prisma.conference as any).findUnique({
            where: { id: params.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
        }

        if (existing.instructorId !== session.userId && session.activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete associated calendar event
        const calEvent = await (prisma.calendarEvent as any).findFirst({
            where: {
                title: existing.title,
                startTime: existing.startTime,
                instructorId: existing.instructorId,
                type: 'conference'
            }
        });

        if (calEvent) {
            await (prisma.calendarEvent as any).delete({
                where: { id: calEvent.id }
            });
        }

        await (prisma.conference as any).delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting conference:', error);
        return NextResponse.json({ error: 'Failed to delete conference' }, { status: 500 });
    }

    });
}
