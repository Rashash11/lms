import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';
const updateNotificationSchema = z.object({
    name: z.string().min(1).optional(),
    eventKey: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    hoursOffset: z.number().int().positive().optional().nullable(),
    offsetDirection: z.enum(['AFTER', 'BEFORE', 'SINCE']).optional().nullable(),
    filterCourses: z.array(z.string()).optional(),
    filterGroups: z.array(z.string()).optional(),
    filterBranches: z.array(z.string()).optional(),
    recipientType: z.string().min(1).optional(),
    recipientUserId: z.string().optional().nullable(),
    messageSubject: z.string().min(1).optional(),
    messageBody: z.string().min(1).optional(),
});

// GET single notification
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { roles: ['ADMIN'] }, async (ctx) => {
        const { id } = await context.params;
        
        try {
            const notification = await prisma.notification.findUnique({
                where: { id },
            });

            if (!notification) {
                return apiError('Notification not found', 404);
            }

            return apiResponse(notification);
        } catch (error) {
            console.error('Error fetching notification:', error);
            throw error;
        }
    });
}

// PUT update notification
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { roles: ['ADMIN'] }, async (ctx) => {
        const { id } = await context.params;
        const body = await request.json();

        const validation = updateNotificationSchema.safeParse(body);
        if (!validation.success) {
            return apiError(validation.error.errors[0].message, 400);
        }

        const data = validation.data;

        try {
            const notification = await prisma.notification.update({
                where: { id },
                data: {
                    ...(data.name !== undefined && { name: data.name }),
                    ...(data.eventKey !== undefined && { eventKey: data.eventKey }),
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
                    ...(data.hoursOffset !== undefined && { hoursOffset: data.hoursOffset }),
                    ...(data.offsetDirection !== undefined && { offsetDirection: data.offsetDirection }),
                    ...(data.filterCourses !== undefined && { filterCourses: data.filterCourses }),
                    ...(data.filterGroups !== undefined && { filterGroups: data.filterGroups }),
                    ...(data.filterBranches !== undefined && { filterBranches: data.filterBranches }),
                    ...(data.recipientType !== undefined && { recipientType: data.recipientType }),
                    ...(data.recipientUserId !== undefined && { recipientUserId: data.recipientUserId }),
                    ...(data.messageSubject !== undefined && { messageSubject: data.messageSubject }),
                    ...(data.messageBody !== undefined && { messageBody: data.messageBody }),
                },
            });

            return apiResponse(notification);
        } catch (error) {
            console.error('Error updating notification:', error);
            throw error;
        }
    });
}

// DELETE notification
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { roles: ['ADMIN'] }, async (ctx) => {
        const { id } = await context.params;
        try {
            await prisma.notification.delete({
                where: { id },
            });

            return apiResponse({ success: true });
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    });
}
