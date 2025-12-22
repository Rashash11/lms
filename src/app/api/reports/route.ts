import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReportSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['user_progress', 'course_completion', 'quiz_results', 'learning_path', 'custom']),
    ruleset: z.record(z.any()),
});

// GET all reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        if (type) {
            where.type = type;
        }

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.report.count({ where }),
        ]);

        return NextResponse.json({
            reports,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}

// POST create report
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createReportSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        const report = await prisma.report.create({
            data: {
                name: data.name,
                type: data.type,
                ruleset: data.ruleset,
                createdBy: 'system', // TODO: Get from session
            },
        });

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error('Error creating report:', error);
        return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }
}

// DELETE bulk delete
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No report IDs provided' }, { status: 400 });
        }

        // Delete scheduled reports first
        await prisma.scheduledReport.deleteMany({
            where: { reportId: { in: ids } },
        });

        const result = await prisma.report.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting reports:', error);
        return NextResponse.json({ error: 'Failed to delete reports' }, { status: 500 });
    }
}
