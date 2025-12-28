export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all user types
export async function GET(request: NextRequest) {
    try {
        const userTypes = await prisma.userType.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
            }
        });

        return NextResponse.json({ userTypes });
    } catch (error) {
        console.error('Error fetching user types:', error);
        return NextResponse.json({ error: 'Failed to fetch user types' }, { status: 500 });
    }
}
