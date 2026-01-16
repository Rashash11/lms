import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        await prisma.courseFile.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    });
}
