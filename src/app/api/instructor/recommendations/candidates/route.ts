import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.activeRole !== 'INSTRUCTOR' && session.activeRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const skillId = searchParams.get('skillId');

        if (!skillId) {
            return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
        }

        // Find users who have some progress in this skill or are enrolled in related courses
        const candidates = await prisma.user.findMany({
            where: {
                activeRole: 'LEARNER',
                // For simplicity, we'll fetch all learners and their skill data if it exists
            },
            include: {
                userSkills: {
                    where: { skillId: skillId }
                }
            },
            take: 20
        });

        const formattedCandidates = candidates.map(user => {
            const userSkill = user.userSkills[0];
            return {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                avatar: user.avatar,
                level: userSkill?.level || 'NONE',
                progress: userSkill?.progress || 0
            };
        }).sort((a, b) => b.progress - a.progress);

        return NextResponse.json({ candidates: formattedCandidates });

    } catch (error) {
        console.error('Error fetching candidates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
