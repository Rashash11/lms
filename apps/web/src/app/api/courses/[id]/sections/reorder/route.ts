import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reorderSchema = z.object({
    sections: z.array(z.object({
        id: z.string().uuid(),
        orderIndex: z.number().int().min(0),
    })),
});

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const body = await request.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const { sections } = validation.data;

        await prisma.$transaction(
            sections.map(section =>
                prisma.courseSection.update({
                    where: { id: section.id, courseId: params.id },
                    data: { orderIndex: section.orderIndex }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering sections:', error);
        return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 });
    }

    });
}
