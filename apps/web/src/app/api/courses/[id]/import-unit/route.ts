import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const importUnitSchema = z.object({
    sourceCourseId: z.string().uuid(),
    sourceUnitId: z.string().uuid(),
    mode: z.enum(['clone', 'link']),
});

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const body = await request.json();
        const validation = importUnitSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const { sourceCourseId, sourceUnitId, mode } = validation.data;

        // Get source unit
        const sourceUnit = await prisma.courseUnit.findUnique({
            where: { id: sourceUnitId, courseId: sourceCourseId }
        });

        if (!sourceUnit) {
            return NextResponse.json({ error: 'Source unit not found' }, { status: 404 });
        }

        // Get max order
        const maxOrderUnit = await prisma.courseUnit.findFirst({
            where: { courseId: params.id },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true }
        });
        const nextOrder = (maxOrderUnit?.orderIndex ?? -1) + 1;

        const newUnit = await prisma.courseUnit.create({
            data: {
                courseId: params.id,
                type: sourceUnit.type,
                title: sourceUnit.title,
                config: sourceUnit.config as any,
                orderIndex: nextOrder,
                status: 'DRAFT',
                linkSourceUnitId: mode === 'link' ? sourceUnitId : null,
            }
        });

        return NextResponse.json(newUnit, { status: 201 });
    } catch (error) {
        console.error('Error importing unit:', error);
        return NextResponse.json({ error: 'Failed to import unit' }, { status: 500 });
    }

    });
}
