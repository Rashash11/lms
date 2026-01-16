import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
const GET_handler = async (request: NextRequest) => {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activeRole = session.activeRole;
        if (activeRole !== 'INSTRUCTOR' && activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const groups = await prisma.group.findMany({
            where: {
                ...(activeRole === 'INSTRUCTOR' ? { instructorId: session.userId } : {}),
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        courses: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function GET(request: NextRequest) {
    return withGuard(request, { roles: ['INSTRUCTOR'] }, () => GET_handler(request));
}

const POST_handler = async (request: NextRequest) => {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activeRole = session.activeRole;
        if (activeRole !== 'INSTRUCTOR' && activeRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, price } = body;

        const group = await prisma.group.create({
            data: {
                name,
                description,
                price: price ? parseFloat(price) : null,
                instructorId: activeRole === 'INSTRUCTOR' ? session.userId : null
            }
        });

        return NextResponse.json({ success: true, group });
    } catch (error) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request: NextRequest) {
    return withGuard(request, { roles: ['INSTRUCTOR'] }, () => POST_handler(request));
}
