import { NextRequest, NextResponse } from 'next/server';
import {
    getOverviewStats,
    getLearningStructureCounts,
    getActivityData,
} from '@/lib/reports/overview';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = (searchParams.get('period') || 'month') as 'month' | 'week' | 'day';

        const [overviewStats, learningStructure, activityData] = await Promise.all([
            getOverviewStats(),
            getLearningStructureCounts(),
            getActivityData(period),
        ]);

        return NextResponse.json({
            overview: overviewStats,
            learningStructure,
            activity: activityData,
        });
    } catch (error) {
        console.error('Error fetching overview data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch overview data' },
            { status: 500 }
        );
    }
}
