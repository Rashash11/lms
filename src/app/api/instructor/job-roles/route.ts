import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.activeRole !== 'INSTRUCTOR' && session.activeRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const jobRoles = await prisma.jobRole.findMany({
            include: {
                skills: {
                    include: {
                        skill: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        const formattedRoles = jobRoles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description,
            skills: role.skills.map(rs => ({
                id: rs.skill.id,
                name: rs.skill.name,
                requiredLevel: rs.requiredLevel,
                weight: rs.weight
            }))
        }));

        return NextResponse.json({ jobRoles: formattedRoles });

    } catch (error) {
        console.error('Error fetching job roles:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
