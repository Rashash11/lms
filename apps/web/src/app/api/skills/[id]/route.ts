import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

// GET single skill

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'skill:read' }, async () => {

    try {
        const session = await requireAuth();
        if (!(await can(session, 'skills:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: skills:read' }, { status: 403 });
        }

        const skill = await (prisma.skill as any).findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { userSkills: true }
                }
            }
        });

        if (!skill) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...skill,
            userCount: skill._count.userSkills
        });
    } catch (error) {
        console.error('Error fetching skill:', error);
        return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
    }

    });
}

// PUT update skill
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'skill:update' }, async () => {

    try {
        const session = await requireAuth();
        if (!(await can(session, 'skills:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: skills:update' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, category, imageUrl } = body;

        const skill = await (prisma.skill as any).update({
            where: { id: params.id },
            data: {
                name,
                description,
                category,
                imageUrl
            }
        });

        return NextResponse.json(skill);
    } catch (error) {
        console.error('Error updating skill:', error);
        return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
    }

    });
}

// DELETE skill
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'skill:update' }, async () => {

    try {
        const session = await requireAuth();
        if (!(await can(session, 'skills:delete'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: skills:delete' }, { status: 403 });
        }

        await (prisma.skill as any).delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting skill:', error);
        return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }

    });
}
