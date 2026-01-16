import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';
import { z } from 'zod';

// Validation schemas
const previewSchema = z.object({
    email: z.string().email()
});

export const dynamic = 'force-dynamic';

// POST /api/admin/notifications/[id]/preview - Send preview email
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { roles: ['ADMIN'] }, async (ctx) => {
        const { id } = await context.params;
        const body = await request.json();

        const validation = previewSchema.safeParse(body);
        if (!validation.success) {
            return apiError('Valid email address is required', 400);
        }

        const { email } = validation.data;

        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            return apiError('Notification not found', 404);
        }

        // TODO: Implement actual email sending
        // For now, just return success
        // Note: Smart tags should NOT be resolved in preview emails
        // console.log('Preview email would be sent to:', email);
        // console.log('Subject:', notification.messageSubject);
        // console.log('Body:', notification.messageBody);

        return apiResponse({
            success: true,
            message: `Preview email sent to ${email}`,
            note: 'Smart tags appear as-is in preview emails and will be replaced with actual data when sent to users.',
        });
    });
}
