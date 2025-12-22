import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const updateAutomationSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['assign_course', 'send_notification', 'deactivate_user', 'webhook', 'assign_badge']).optional(),
    parameters: z.record(z.any()).optional(),
    filters: z.record(z.any()).nullable().optional(),
    enabled: z.boolean().optional(),
});

// GET single automation with logs
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const includeLogs = searchParams.get('includeLogs') === 'true';
        const logLimit = parseInt(searchParams.get('logLimit') || '20');

        const automation = await prisma.automation.findUnique({
            where: { id: params.id },
        });

        if (!automation) {
            return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
        }

        let logs: any[] = [];
        let logCount = 0;

        if (includeLogs) {
            [logs, logCount] = await Promise.all([
                prisma.automationLog.findMany({
                    where: { automationId: params.id },
                    orderBy: { executedAt: 'desc' },
                    take: logLimit,
                }),
                prisma.automationLog.count({ where: { automationId: params.id } }),
            ]);
        }

        return NextResponse.json({
            ...automation,
            logs,
            logCount,
        });
    } catch (error) {
        console.error('Error fetching automation:', error);
        return NextResponse.json({ error: 'Failed to fetch automation' }, { status: 500 });
    }
}

// PUT update automation
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = updateAutomationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        const automation = await prisma.automation.update({
            where: { id: params.id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.type !== undefined && { type: data.type }),
                ...(data.parameters !== undefined && { parameters: data.parameters }),
                ...(data.filters !== undefined && { filters: data.filters === null ? Prisma.DbNull : data.filters }),
                ...(data.enabled !== undefined && { enabled: data.enabled }),
            },
        });

        return NextResponse.json(automation);
    } catch (error) {
        console.error('Error updating automation:', error);
        return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
    }
}

// DELETE automation
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Delete logs first
        await prisma.automationLog.deleteMany({
            where: { automationId: params.id },
        });

        await prisma.automation.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting automation:', error);
        return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 });
    }
}

// PATCH toggle or run
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { action, testUserId } = body;

        if (action === 'toggle') {
            const automation = await prisma.automation.findUnique({
                where: { id: params.id },
            });

            if (!automation) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            const updated = await prisma.automation.update({
                where: { id: params.id },
                data: { enabled: !automation.enabled },
            });

            return NextResponse.json(updated);
        }

        if (action === 'run' && testUserId) {
            // Log a test run
            const log = await prisma.automationLog.create({
                data: {
                    automationId: params.id,
                    userId: testUserId,
                    status: 'TEST_RUN',
                    details: { note: 'Manual test execution' },
                },
            });

            return NextResponse.json({
                success: true,
                log,
                message: 'Automation test run logged'
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error patching automation:', error);
        return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
    }
}
