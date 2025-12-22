import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAutomationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['assign_course', 'send_notification', 'deactivate_user', 'webhook', 'assign_badge']),
    parameters: z.record(z.any()),
    filters: z.record(z.any()).optional(),
    enabled: z.boolean().optional(),
});

// GET all automations with logs count
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const enabled = searchParams.get('enabled');
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

        if (enabled !== null && enabled !== undefined) {
            where.enabled = enabled === 'true';
        }

        const [automations, total] = await Promise.all([
            prisma.automation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.automation.count({ where }),
        ]);

        // Get run counts for each automation
        const automationIds = automations.map((a: any) => a.id);
        const logCounts = await prisma.automationLog.groupBy({
            by: ['automationId'],
            where: { automationId: { in: automationIds } },
            _count: { id: true },
        });

        const countMap = new Map(logCounts.map((l: any) => [l.automationId, l._count.id]));

        const automationsWithCounts = automations.map((a: any) => ({
            ...a,
            runCount: countMap.get(a.id) || 0,
        }));

        return NextResponse.json({
            automations: automationsWithCounts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching automations:', error);
        return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
    }
}

// POST create automation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createAutomationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        const automation = await prisma.automation.create({
            data: {
                name: data.name,
                type: data.type,
                parameters: data.parameters,
                filters: data.filters,
                enabled: data.enabled ?? true,
            },
        });

        return NextResponse.json(automation, { status: 201 });
    } catch (error) {
        console.error('Error creating automation:', error);
        return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 });
    }
}

// DELETE bulk delete
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No automation IDs provided' }, { status: 400 });
        }

        // Delete logs first
        await prisma.automationLog.deleteMany({
            where: { automationId: { in: ids } },
        });

        const result = await prisma.automation.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting automations:', error);
        return NextResponse.json({ error: 'Failed to delete automations' }, { status: 500 });
    }
}

// PATCH bulk enable/disable
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, enabled } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No automation IDs provided' }, { status: 400 });
        }

        const result = await prisma.automation.updateMany({
            where: { id: { in: ids } },
            data: { enabled: enabled ?? true },
        });

        return NextResponse.json({ success: true, updated: result.count });
    } catch (error) {
        console.error('Error updating automations:', error);
        return NextResponse.json({ error: 'Failed to update automations' }, { status: 500 });
    }
}
