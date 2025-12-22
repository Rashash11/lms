import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/learning-paths/[id]/options - Get learning path options
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Fetch learning path with only the fields needed for options
        const learningPath = await prisma.learningPath.findUnique({
            where: { id: params.id },
            select: {
                isActive: true,
                code: true,
                category: true,
                completionDaysLimit: true,
                accessRetentionEnabled: true,
                courseOrderMode: true,
                completionRule: true,
                certificateType: true,
            },
        });

        if (!learningPath) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            );
        }

        // Fetch available categories
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json({
            options: learningPath,
            categories,
        });
    } catch (error) {
        console.error('Failed to fetch learning path options:', error);
        return NextResponse.json(
            { error: 'Failed to fetch learning path options' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/learning-paths/[id]/options - Update learning path options
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const {
            isActive,
            code,
            category,
            completionDaysLimit,
            accessRetentionEnabled,
            courseOrderMode,
            completionRule,
            certificateType,
        } = body;

        // Check if learning path exists
        const existing = await prisma.learningPath.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            );
        }

        // Validate code uniqueness if provided and different from current
        if (code !== undefined && code !== existing.code) {
            if (code) {
                const duplicate = await prisma.learningPath.findFirst({
                    where: {
                        code,
                        id: { not: params.id },
                    },
                });
                if (duplicate) {
                    return NextResponse.json(
                        { error: 'Code already exists', field: 'code' },
                        { status: 409 }
                    );
                }
            }
        }

        // Validate completionDaysLimit if provided
        if (completionDaysLimit !== undefined && completionDaysLimit !== null) {
            const days = parseInt(completionDaysLimit);
            if (isNaN(days) || days < 1) {
                return NextResponse.json(
                    { error: 'Completion days limit must be at least 1', field: 'completionDaysLimit' },
                    { status: 400 }
                );
            }
        }

        // Validate enum values
        if (courseOrderMode !== undefined && courseOrderMode !== null) {
            if (!['SEQUENTIAL', 'ANY'].includes(courseOrderMode)) {
                return NextResponse.json(
                    { error: 'Invalid course order mode', field: 'courseOrderMode' },
                    { status: 400 }
                );
            }
        }

        if (completionRule !== undefined && completionRule !== null) {
            if (!['ALL_COURSES_COMPLETED'].includes(completionRule)) {
                return NextResponse.json(
                    { error: 'Invalid completion rule', field: 'completionRule' },
                    { status: 400 }
                );
            }
        }

        if (certificateType !== undefined && certificateType !== null) {
            if (!['CLASSIC', 'FANCY', 'MODERN', 'SIMPLE'].includes(certificateType)) {
                return NextResponse.json(
                    { error: 'Invalid certificate type', field: 'certificateType' },
                    { status: 400 }
                );
            }
        }

        // Build update data object
        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (code !== undefined) updateData.code = code || null;
        if (category !== undefined) updateData.category = category || null;
        if (completionDaysLimit !== undefined) {
            updateData.completionDaysLimit = completionDaysLimit ? parseInt(completionDaysLimit) : null;
        }
        if (accessRetentionEnabled !== undefined) updateData.accessRetentionEnabled = accessRetentionEnabled;
        if (courseOrderMode !== undefined) updateData.courseOrderMode = courseOrderMode;
        if (completionRule !== undefined) updateData.completionRule = completionRule;
        if (certificateType !== undefined) updateData.certificateType = certificateType || null;

        // Update learning path
        const updatedPath = await prisma.learningPath.update({
            where: { id: params.id },
            data: updateData,
            select: {
                isActive: true,
                code: true,
                category: true,
                completionDaysLimit: true,
                accessRetentionEnabled: true,
                courseOrderMode: true,
                completionRule: true,
                certificateType: true,
            },
        });

        // Fetch categories again for consistency
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json({
            options: updatedPath,
            categories,
        });
    } catch (error) {
        console.error('Failed to update learning path options:', error);
        return NextResponse.json(
            { error: 'Failed to update learning path options' },
            { status: 500 }
        );
    }
}
