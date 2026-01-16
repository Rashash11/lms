import { NextRequest, NextResponse } from 'next/server';
import { ALL_NOTIFICATION_EVENTS } from '@modules/notifications/server/events';
import { withGuard } from '@/lib/api-guard';

// GET /api/admin/notifications/events - Get all available notification events

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, { roles: ['ADMIN'] }, async () => {
        try {
            // Group events by category
            const groupedEvents = ALL_NOTIFICATION_EVENTS.reduce((acc, event) => {
                if (!acc[event.category]) {
                    acc[event.category] = [];
                }
                acc[event.category].push(event);
                return acc;
            }, {} as Record<string, typeof ALL_NOTIFICATION_EVENTS>);

            return NextResponse.json({
                events: ALL_NOTIFICATION_EVENTS,
                grouped: groupedEvents,
            });
        } catch (error) {
            console.error('Error fetching notification events:', error);
            return NextResponse.json(
                { error: 'Failed to fetch events' },
                { status: 500 }
            );
        }
    });
}
