import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const recommendationSchema = z.object({
    skillId: z.string().min(1),
    userId: z.string().min(1),
    note: z.string().optional()
});

export const dynamic = 'force-dynamic';

const POST_handler = async (req: NextRequest) => {
    try {
        const session = await getSession();
        if (!session || (session.activeRole !== 'INSTRUCTOR' && session.activeRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        
        const validation = recommendationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'BAD_REQUEST', message: validation.error.errors[0].message },
                { status: 400 }
            );
        }
        
        const { skillId, userId, note } = validation.data;

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
export async function POST(req: NextRequest) {
    return withGuard(req, { roles: ['INSTRUCTOR'] }, () => POST_handler(req));
}
