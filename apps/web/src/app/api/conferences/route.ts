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
const createConferenceSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    duration: z.number().int().positive().optional(),
});

/**
 * GET /api/conferences
 * List conferences for the current instructor
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'conference:read'
    }, async (ctx: GuardedContext) => {
        const conferences = await prisma.conference.findMany({
            where: { instructorId: ctx.session.userId },
            orderBy: { startTime: 'asc' }
        });

        return apiResponse({ data: conferences });
    });
}

/**
 * POST /api/conferences
 * Create a conference
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'conference:create',
        auditEvent: 'CONFERENCE_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, createConferenceSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const conference = await prisma.conference.create({
            data: {
                title: data.title,
                description: data.description,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                duration: data.duration || 60,
                instructorId: ctx.session.userId,
            }
        });

        // Also create a calendar event
        await prisma.calendarEvent.create({
            data: {
                title: `Conference: ${data.title}`,
                description: data.description,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                type: 'conference',
                instructorId: ctx.session.userId,
            }
        });

        return apiResponse(conference, 201);
    });
}
