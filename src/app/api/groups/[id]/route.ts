import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const updateGroupSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    maxMembers: z.number().int().positive().nullable().optional(),
    branchId: z.string().uuid().nullable().optional(),
    regenerateKey: z.boolean().optional(),
});

// GET single group with members and courses
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const group = await prisma.group.findUnique({
            where: { id: params.id },
            include: {
                members: {
                    include: {
                        // Note: We can't include user here without relation
                        // Will fetch separately
                    }
                },
                courses: true,
            },
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Fetch member user details
        const memberUserIds = group.members.map(m => m.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: memberUserIds } },
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        });

        const userMap = new Map(users.map(u => [u.id, u]));
        const membersWithDetails = group.members.map(m => ({
            ...m,
            user: userMap.get(m.userId),
        }));

        // Fetch course details
        const courseIds = group.courses.map(c => c.courseId);
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, title: true, code: true, status: true, thumbnail_url: true }
        });

        const courseMap = new Map(courses.map(c => [c.id, c]));
        const coursesWithDetails = group.courses.map(gc => ({
            ...gc,
            course: courseMap.get(gc.courseId),
        }));

        return NextResponse.json({
            ...group,
            members: membersWithDetails,
            courses: coursesWithDetails,
            memberCount: group.members.length,
            courseCount: group.courses.length,
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }
}

// PUT update group
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = updateGroupSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { name, description, maxMembers, branchId, regenerateKey } = validation.data;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (maxMembers !== undefined) updateData.maxMembers = maxMembers;
        if (branchId !== undefined) updateData.branchId = branchId;
        if (regenerateKey) {
            updateData.key = randomBytes(4).toString('hex').toUpperCase();
        }

        const group = await prisma.group.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error updating group:', error);
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}

// DELETE group
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.group.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }
}

// PATCH - add/remove members or courses
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { action, userIds, courseIds } = body;

        if (action === 'addMembers' && userIds?.length) {
            // Check max members limit
            const group = await prisma.group.findUnique({
                where: { id: params.id },
                include: { _count: { select: { members: true } } }
            });

            if (group?.maxMembers && (group._count.members + userIds.length) > group.maxMembers) {
                return NextResponse.json(
                    { error: `Max members (${group.maxMembers}) exceeded` },
                    { status: 400 }
                );
            }

            await prisma.groupMember.createMany({
                data: userIds.map((userId: string) => ({
                    groupId: params.id,
                    userId,
                })),
                skipDuplicates: true,
            });
            return NextResponse.json({ success: true, added: userIds.length });
        }

        if (action === 'removeMembers' && userIds?.length) {
            await prisma.groupMember.deleteMany({
                where: {
                    groupId: params.id,
                    userId: { in: userIds },
                },
            });
            return NextResponse.json({ success: true, removed: userIds.length });
        }

        if (action === 'addCourses' && courseIds?.length) {
            await prisma.groupCourse.createMany({
                data: courseIds.map((courseId: string) => ({
                    groupId: params.id,
                    courseId,
                })),
                skipDuplicates: true,
            });
            return NextResponse.json({ success: true, added: courseIds.length });
        }

        if (action === 'removeCourses' && courseIds?.length) {
            await prisma.groupCourse.deleteMany({
                where: {
                    groupId: params.id,
                    courseId: { in: courseIds },
                },
            });
            return NextResponse.json({ success: true, removed: courseIds.length });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error patching group:', error);
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}
