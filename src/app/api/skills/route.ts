import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all skills
export async function GET(request: NextRequest) {
    try {
        const skills = await prisma.skill.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { userSkills: true }
                }
            }
        });

        // Transform to include userCount
        const skillsWithCounts = skills.map(skill => ({
            ...skill,
            userCount: skill._count.userSkills,
            _count: undefined
        }));

        return NextResponse.json(skillsWithCounts);
    } catch (error) {
        console.error('Error fetching skills:', error);
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }
}

// POST create skill
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description } = body;

        const skill = await (prisma.skill as any).create({
            data: {
                name,
                description,
            }
        });

        return NextResponse.json(skill, { status: 201 });
    } catch (error) {
        console.error('Error creating skill:', error);
        return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }
}
