import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateBody, ValidationError } from '@/lib/validations';
import { z } from 'zod';

// Create schema
const createSkillSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

/**
 * GET /api/skills
 * List all skills
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'skills:read'
    }, async (ctx: GuardedContext) => {
        const skills = await prisma.skill.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { userSkills: true }
                }
            }
        });

        const skillsWithCounts = skills.map(skill => ({
            ...skill,
            userCount: skill._count.userSkills,
            _count: undefined
        }));

        return apiResponse({ data: skillsWithCounts });
    });
}

/**
 * POST /api/skills
 * Create a skill
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'skills:create',
        roles: ['ADMIN', 'INSTRUCTOR'],
        auditEvent: 'SKILL_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, createSkillSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const skill = await (prisma.skill as any).create({
            data: {
                name: data.name,
                description: data.description,
            }
        });

        return apiResponse(skill, 201);
    });
}
