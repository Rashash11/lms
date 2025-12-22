import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE enrollment
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; enrollmentId: string } }
) {
    try {
        // Verify enrollment belongs to course
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: { id: params.enrollmentId },
        });

        if (!existingEnrollment) {
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        if (existingEnrollment.courseId !== params.id) {
            return NextResponse.json({ error: 'Enrollment does not belong to this course' }, { status: 403 });
        }

        await prisma.enrollment.delete({
            where: { id: params.enrollmentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 });
    }
}
