import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET single skill
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
}

// PUT update skill
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session || session.activeRole !== 'ADMIN' && session.activeRole !== 'SUPER_INSTRUCTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
}

// DELETE skill
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session || session.activeRole !== 'ADMIN' && session.activeRole !== 'SUPER_INSTRUCTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await (prisma.skill as any).delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting skill:', error);
        return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }
}
