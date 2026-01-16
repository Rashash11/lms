import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';


export const dynamic = 'force-dynamic';
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(req, { roles: ['INSTRUCTOR', 'ADMIN'] }, async () => {

    try {
        const session = await getSession();
        if (!session || (session.activeRole !== 'INSTRUCTOR' && session.activeRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const skillId = params.id;
        const userId = session.userId;

        const skill = await prisma.skill.findUnique({
            where: { id: skillId },
            include: {
                courseSkills: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                code: true,
                                thumbnailUrl: true,
                                status: true
                            }
                        }
                    }
                },
                learningPathSkills: {
                    include: {
                        learningPath: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                image: true,
                                status: true
                            }
                        }
                    }
                },
                userSkills: {
                    where: { userId: userId },
                    select: {
                        level: true,
                        progress: true,
                        updatedAt: true
                    }
                },
                _count: {
                    select: {
                        userSkills: true
                    }
                }
            }
        });

        if (!skill) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        // Format the response
        const formattedSkill = {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            image: skill.imageUrl,
            level: skill.userSkills[0]?.level || null,
            progress: skill.userSkills[0]?.progress || 0,
            lastUpdated: skill.userSkills[0]?.updatedAt || null,
            userCount: skill._count.userSkills,
            courses: skill.courseSkills.map(cs => cs.course),
            learningPaths: skill.learningPathSkills.map(lps => lps.learningPath)
        };

        return NextResponse.json({ skill: formattedSkill });

    } catch (error) {
        console.error('Error fetching skill detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    });
}
