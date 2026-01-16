import { withGuard } from '@/lib/api-guard';
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getTimelineEvents, TimelineFilters } from '@modules/reports/server/timeline';

const GET_handler = async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);

        const filters: TimelineFilters = {};

        if (searchParams.get('from')) {
            filters.from = new Date(searchParams.get('from')!);
        }
        if (searchParams.get('to')) {
            filters.to = new Date(searchParams.get('to')!);
        }
        if (searchParams.get('event')) {
            filters.eventType = searchParams.get('event')!;
        }
        if (searchParams.get('user')) {
            filters.userId = searchParams.get('user')!;
        }
        if (searchParams.get('course')) {
            filters.courseId = searchParams.get('course')!;
        }

        const events = await getTimelineEvents(filters);

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error fetching timeline:', error);
        return NextResponse.json(
            { error: 'Failed to fetch timeline' },
            { status: 500 }
        );
    }
}
export async function GET(request: NextRequest) {
    return withGuard(request, { permission: 'report:read' }, () => GET_handler(request));
}
