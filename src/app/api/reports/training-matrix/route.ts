export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getTrainingMatrix, TrainingMatrixFilters } from '@/lib/reports/training-matrix';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const filters: TrainingMatrixFilters = {
            search: searchParams.get('search') || undefined,
            branchId: searchParams.get('branchId') || undefined,
            groupId: searchParams.get('groupId') || undefined,
        };

        const matrixData = await getTrainingMatrix(filters);

        return NextResponse.json(matrixData);
    } catch (error) {
        console.error('Error fetching training matrix:', error);
        return NextResponse.json(
            { error: 'Failed to fetch training matrix' },
            { status: 500 }
        );
    }
}
