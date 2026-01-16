import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
const updateReportSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['user_progress', 'course_completion', 'quiz_results', 'learning_path', 'custom']).optional(),
    ruleset: z.record(z.any()).optional(),
});

// GET single report with generation
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'report:read' }, async () => {

    try {
        const { searchParams } = new URL(request.url);
        const generate = searchParams.get('generate') === 'true';

        const report = await prisma.report.findUnique({
            where: { id: params.id },
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // If generate is requested, run the report query
        if (generate) {
            const data = await generateReportData(report);
            return NextResponse.json({
                ...report,
                data,
                generatedAt: new Date().toISOString(),
            });
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
    }

    });
}

// Generate report data based on type
async function generateReportData(report: any) {
    const ruleset = report.ruleset || {};

    switch (report.type) {
        case 'user_progress': {
            const users = await prisma.user.findMany({
                take: 100,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    lastLoginAt: true,
                    status: true,
                },
            });
            return { users, count: users.length };
        }

        case 'course_completion': {
            const courses = await prisma.course.findMany({
                take: 50,
                select: {
                    id: true,
                    title: true,
                    code: true,
                    status: true,
                },
            });
            // TODO: Add enrollment/completion data
            return { courses, count: courses.length };
        }

        case 'quiz_results': {
            const attempts = await prisma.testAttempt.findMany({
                take: 100,
                orderBy: { startedAt: 'desc' },
            });
            return { attempts, count: attempts.length };
        }

        default:
            return { message: 'Custom report - configure ruleset' };
    }
}

// PUT update report
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'report:read' }, async () => {

    try {
        const body = await request.json();

        const validation = updateReportSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        const report = await prisma.report.update({
            where: { id: params.id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.type !== undefined && { type: data.type }),
                ...(data.ruleset !== undefined && { ruleset: data.ruleset }),
            },
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    });
}

// DELETE report
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'report:read' }, async () => {

    try {
        // Delete scheduled reports first
        await prisma.scheduledReport.deleteMany({
            where: { reportId: params.id },
        });

        await prisma.report.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting report:', error);
        return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }

    });
}

// POST export report (generates CSV/XLSX)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'report:read' }, async () => {

    try {
        const body = await request.json();
        const { format = 'csv' } = body;

        const report = await prisma.report.findUnique({
            where: { id: params.id },
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const data = await generateReportData(report);

        // TODO: Implement actual CSV/XLSX generation
        // For now, return JSON data
        return NextResponse.json({
            success: true,
            format,
            data,
            message: `Report export in ${format.toUpperCase()} format would be generated here`,
        });
    } catch (error) {
        console.error('Error exporting report:', error);
        return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
    }

    });
}
