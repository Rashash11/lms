import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        const userId = session?.userId || 'preview-user';

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';

        // Build where clause
        const where: any = {
            instructorId: userId,
        };

        // Add search filter
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Add status filter
        if (status !== 'all') {
            where.status = status.toUpperCase();
        }

        // Fetch courses where instructorId matches current user
        const courses = await prisma.course.findMany({
            where,
            take: limit,
            orderBy: {
                updatedAt: 'desc'
            },
            select: {
                id: true,
                title: true,
                code: true,
                thumbnail_url: true,
                description: true,
                status: true,
                hiddenFromCatalog: true,
                updatedAt: true,
                createdAt: true,
            }
        });

        // Get total count
        const total = await prisma.course.count({ where });

        return NextResponse.json({ courses, total });
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        );
    }
}
