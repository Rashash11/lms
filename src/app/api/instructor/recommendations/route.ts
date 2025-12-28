import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.activeRole !== 'INSTRUCTOR' && session.activeRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { skillId, userId, note } = body;

        if (!skillId || !userId) {
            return NextResponse.json({ error: 'Skill ID and User ID are required' }, { status: 400 });
        }

        const recommendation = await prisma.skillRecommendation.create({
            data: {
                fromUserId: session.userId,
                toUserId: userId,
                skillId: skillId,
                note: note
            }
        });

        return NextResponse.json({
            success: true,
            recommendation
        });

    } catch (error) {
        console.error('Error creating recommendation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
