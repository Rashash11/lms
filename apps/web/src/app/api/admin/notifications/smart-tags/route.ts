import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { ALL_SMART_TAGS, getTagsByCategory } from '@modules/notifications/server/smartTags';

// GET /api/admin/notifications/smart-tags - Get all available smart tags

export const dynamic = 'force-dynamic';
const GET_handler = async (request: NextRequest) => {
    try {
        // Group tags by category
        const categorized = {
            USER: getTagsByCategory('USER'),
            COURSE: getTagsByCategory('COURSE'),
            LEARNING_PATH: getTagsByCategory('LEARNING_PATH'),
            ORGANIZATION: getTagsByCategory('ORGANIZATION'),
            SYSTEM: getTagsByCategory('SYSTEM'),
        };

        return NextResponse.json({
            tags: ALL_SMART_TAGS,
            categorized,
        });
    } catch (error) {
        console.error('Error fetching smart tags:', error);
        return NextResponse.json(
            { error: 'Failed to fetch smart tags' },
            { status: 500 }
        );
    }
}
export async function GET(request: NextRequest) {
    return withGuard(request, { roles: ['ADMIN'] }, () => GET_handler(request));
}
