import { NextRequest, NextResponse } from 'next/server';
import { generateTrainingProgressExcel } from '@/lib/reports/excel-export';

export async function POST(request: NextRequest) {
    try {
        // Get domain from request or env
        const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'zedny.talentlms.com';

        // Generate Excel workbook
        const workbook = await generateTrainingProgressExcel(domain);

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Return as downloadable file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="Training_progress.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generating training progress export:', error);
        return NextResponse.json(
            { error: 'Failed to generate export' },
            { status: 500 }
        );
    }
}
