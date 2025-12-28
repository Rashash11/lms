import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { SkillLevel } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.activeRole !== 'INSTRUCTOR' && session.activeRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;
        const { searchParams } = new URL(req.url);

        const tab = searchParams.get('tab') || 'all';
        const search = searchParams.get('search') || '';
        const sort = searchParams.get('sort') || 'suggested';
        const dir = searchParams.get('dir') || 'asc';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 12;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (tab === 'my') {
            where.userSkills = {
                some: {
                    userId: userId
                }
            };
        }

        let orderBy: any = {};
        switch (sort) {
            case 'alphabetical':
                orderBy = { name: dir };
                break;
            case 'popularity':
                orderBy = { userSkills: { _count: dir } };
                break;
            case 'relevance':
            case 'suggested':
            default:
                orderBy = { createdAt: 'desc' };
        }

        const [skills, total] = await Promise.all([
            prisma.skill.findMany({
                where,
                include: {
                    userSkills: {
                        where: { userId: userId },
                        select: {
                            level: true,
                            progress: true
                        }
                    },
                    _count: {
                        select: { userSkills: true }
                    }
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.skill.count({ where })
        ]);

        const formattedSkills = skills.map(skill => {
            const userSkill = skill.userSkills[0];
            return {
                id: skill.id,
                name: skill.name,
                description: skill.description,
                image: skill.imageUrl,
                level: userSkill?.level || null,
                progress: userSkill?.progress || 0,
                popularity: skill._count.userSkills
            };
        });

        return NextResponse.json({
            skills: formattedSkills,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching skills:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
