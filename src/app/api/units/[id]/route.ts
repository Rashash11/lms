import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { z } from 'zod';

const unitTypes = ['TEXT', 'FILE', 'EMBED', 'VIDEO', 'TEST', 'SURVEY', 'ASSIGNMENT', 'ILT', 'SCORM', 'XAPI', 'CMI5', 'TALENTCRAFT', 'SECTION', 'WEB', 'AUDIO', 'DOCUMENT', 'IFRAME'] as const;

const updateUnitSchema = z.object({
    type: z.enum(unitTypes).optional(),
    title: z.string().min(1).optional(),
    sectionId: z.string().uuid().nullable().optional(),
    content: z.any().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED_CHANGES']).optional(),
    isSample: z.boolean().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!can(session, 'unit:update_any') && !can(session, 'unit:publish')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission to update or publish units' }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateUnitSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const unit = await prisma.courseUnit.update({
            where: { id: params.id },
            data: validation.data as any
        });

        return NextResponse.json(unit);
    } catch (error) {
        console.error('Error updating unit:', error);
        return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!can(session, 'unit:delete_any')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: unit:delete_any' }, { status: 403 });
        }
        await prisma.courseUnit.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting unit:', error);
        return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 });
    }
}
