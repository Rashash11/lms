import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/notifications/[id]/preview - Send preview email
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email address is required' },
                { status: 400 }
            );
        }

        const notification = await prisma.notification.findUnique({
            where: { id: params.id },
        });

        if (!notification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        // TODO: Implement actual email sending
        // For now, just return success
        // Note: Smart tags should NOT be resolved in preview emails
        console.log('Preview email would be sent to:', email);
        console.log('Subject:', notification.messageSubject);
        console.log('Body:', notification.messageBody);

        return NextResponse.json({
            success: true,
            message: `Preview email sent to ${email}`,
            note: 'Smart tags appear as-is in preview emails and will be replaced with actual data when sent to users.',
        });
    } catch (error) {
        console.error('Error sending preview email:', error);
        return NextResponse.json(
            { error: 'Failed to send preview email' },
            { status: 500 }
        );
    }
}
