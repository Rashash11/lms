import { withGuard } from '@/lib/api-guard';
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import {
    getOverviewStats,
    getLearningStructureCounts,
    getActivityData,
    getEnrollmentDistribution,
    getTopCoursesByEnrollment,
    getUserEngagementMetrics,
    getBranchStats,
    getLearningPathProgress,
} from '@modules/reports/server/overview';

const GET_handler = async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const period = (searchParams.get('period') || 'month') as 'month' | 'week' | 'day';

        const [
            overviewStats,
            learningStructure,
            activityData,
            enrollmentDistribution,
            topCourses,
            userEngagement,
            branchStats,
            learningPathProgress,
        ] = await Promise.all([
            getOverviewStats(),
            getLearningStructureCounts(),
            getActivityData(period),
            getEnrollmentDistribution(),
            getTopCoursesByEnrollment(),
            getUserEngagementMetrics(),
            getBranchStats(),
            getLearningPathProgress(),
        ]);

        return NextResponse.json({
            overview: overviewStats,
            learningStructure,
            activity: activityData,
            enrollmentDistribution,
            topCourses,
            userEngagement,
            branchStats,
            learningPathProgress,
        });
    } catch (error) {
        console.error('Error fetching overview data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch overview data' },
            { status: 500 }
        );
    }
}
export async function GET(request: NextRequest) {
    return withGuard(request, { permission: 'report:read' }, () => GET_handler(request));
}

