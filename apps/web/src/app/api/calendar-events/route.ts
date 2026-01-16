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
const createEventSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    type: z.enum(['general', 'course', 'conference', 'deadline', 'custom']).optional(),
});

/**
 * GET /api/calendar-events
 * List calendar events for the current user
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'calendar:read'
    }, async (ctx: GuardedContext) => {
        const events = await prisma.calendarEvent.findMany({
            where: {
                OR: [
                    { instructorId: ctx.session.userId },
                    { type: 'course' },
                ]
            },
            orderBy: { startTime: 'asc' }
        });

        return apiResponse({ data: events });
    });
}

/**
 * POST /api/calendar-events
 * Create a calendar event
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'calendar:create',
        auditEvent: 'CALENDAR_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, createEventSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const event = await prisma.calendarEvent.create({
            data: {
                title: data.title,
                description: data.description || null,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                type: data.type || 'general',
                instructorId: ctx.session.userId,
            }
        });

        return apiResponse(event, 201);
    });
}
