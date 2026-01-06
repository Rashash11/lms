import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

// GET /api/learning-paths - List all learning paths with search, filter, sort
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'learning_path:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: learning_path:read' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const sortBy = searchParams.get('sortBy') || 'updatedAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status !== 'all') {
            where.status = status;
        }

        // Build orderBy
        const orderBy: any = {};
        if (sortBy === 'courses') {
            // We'll sort by count in memory after fetching
            orderBy.updatedAt = sortOrder;
        } else {
            orderBy[sortBy] = sortOrder;
        }

        // Fetch learning paths with course count
        const learningPaths = await prisma.learningPath.findMany({
            where,
            orderBy,
            include: {
                courses: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        // Transform data to include course count
        const transformedPaths = learningPaths.map((path) => ({
            id: path.id,
            name: path.name,
            code: path.code || '',
            category: path.category || '',
            status: path.status,
            courseCount: path.courses.length,
            updatedAt: path.updatedAt,
            createdAt: path.createdAt,
        }));

        // Sort by course count if requested
        if (sortBy === 'courses') {
            transformedPaths.sort((a, b) => {
                const comparison = a.courseCount - b.courseCount;
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }

        return NextResponse.json(transformedPaths);
    } catch (error) {
        console.error('Failed to fetch learning paths:', error);
        return NextResponse.json(
            { error: 'Failed to fetch learning paths' },
            { status: 500 }
        );
    }
}

// POST /api/learning-paths - Create new learning path
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'learning_path:create'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: learning_path:create' }, { status: 403 });
        }

        const body = await request.json();
        const { name, code, category, description, status } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Check if code already exists (if provided)
        if (code) {
            const existing = await prisma.learningPath.findUnique({
                where: { code },
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Learning path with this code already exists' },
                    { status: 400 }
                );
            }
        }

        // Create learning path
        const learningPath = await prisma.learningPath.create({
            data: {
                name,
                code: code || null,
                category: category || null,
                description: description || null,
                status: status || 'inactive',
                // Set defaults for new fields explicitly
                courseOrderMode: 'ANY',
                completionRule: 'ALL_COURSES_COMPLETED',
                accessRetentionEnabled: false,
            },
            include: {
                courses: true,
            },
        });

        return NextResponse.json(learningPath, { status: 201 });
    } catch (error) {
        console.error('Failed to create learning path:', error);
        return NextResponse.json(
            { error: 'Failed to create learning path' },
            { status: 500 }
        );
    }
}
