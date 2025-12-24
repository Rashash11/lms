import { NextRequest, NextResponse } from 'next/server';
import { getTrainingMatrix } from '@/lib/reports/training-matrix';
import { generateMatrixExcel } from '@/lib/reports/excel-export';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { search, branchId, groupId } = body;

        // Get matrix data
        const { users, courses } = await getTrainingMatrix({ search, branchId, groupId });

        // Generate Excel workbook
        const workbook = await generateMatrixExcel(users, courses);

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Return as downloadable file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="Training_matrix.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generating matrix export:', error);
        return NextResponse.json(
            { error: 'Failed to generate matrix export' },
            { status: 500 }
        );
    }
}
