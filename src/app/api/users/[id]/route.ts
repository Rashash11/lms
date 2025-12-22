import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordPolicy, RoleKey } from '@/lib/auth';
import { z } from 'zod';

const updateUserSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    password: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED', 'LOCKED']).optional(),
    roles: z.array(z.enum(['ADMIN', 'INSTRUCTOR', 'LEARNER'])).optional(),
    excludeFromEmails: z.boolean().optional(),
    avatar: z.string().optional(),
});

// GET single user with roles
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                roles: { select: { roleKey: true } }
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...user,
            passwordHash: undefined,
            roles: user.roles.map(r => r.roleKey),
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PUT update user with roles
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = updateUserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { firstName, lastName, email, username, status, roles, password, excludeFromEmails, avatar } = validation.data;

        // Check if email/username already taken by another user
        if (email || username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    id: { not: params.id },
                    OR: [
                        ...(email ? [{ email: email.toLowerCase() }] : []),
                        ...(username ? [{ username }] : []),
                    ],
                },
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email or username already in use' },
                    { status: 400 }
                );
            }
        }

        // Prepare update data
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email.toLowerCase();
        if (username !== undefined) updateData.username = username;
        if (status !== undefined) updateData.status = status;
        if (excludeFromEmails !== undefined) updateData.excludeFromEmails = excludeFromEmails;
        if (avatar !== undefined) updateData.avatar = avatar;

        // Update password if provided
        if (password) {
            const policyCheck = validatePasswordPolicy(password);
            if (!policyCheck.valid) {
                return NextResponse.json({ error: policyCheck.error }, { status: 400 });
            }
            updateData.passwordHash = await hashPassword(password);
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            include: { roles: true },
        });

        // Update roles if provided
        if (roles && roles.length > 0) {
            // Delete existing roles
            await prisma.userRole.deleteMany({
                where: { userId: params.id },
            });

            // Create new roles
            await prisma.userRole.createMany({
                data: roles.map((roleKey) => ({
                    userId: params.id,
                    roleKey,
                })),
            });

            // Update active role if current one is no longer assigned
            if (!roles.includes(user.activeRole)) {
                await prisma.user.update({
                    where: { id: params.id },
                    data: { activeRole: roles[0] },
                });
            }
        }

        // Fetch updated user
        const updatedUser = await prisma.user.findUnique({
            where: { id: params.id },
            include: { roles: true },
        });

        return NextResponse.json({
            ...updatedUser,
            passwordHash: undefined,
            roles: updatedUser?.roles.map(r => r.roleKey),
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE user
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Delete user roles first
        await prisma.userRole.deleteMany({
            where: { userId: params.id },
        });

        // Delete user
        await prisma.user.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

// PATCH unlock user or update specific fields
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'unlock') {
            const user = await prisma.user.update({
                where: { id: params.id },
                data: {
                    lockedUntil: null,
                    failedLoginAttempts: 0,
                    status: 'ACTIVE',
                },
            });

            // Log timeline event
            await prisma.timelineEvent.create({
                data: {
                    userId: params.id,
                    eventType: 'USER_UNLOCKED',
                    details: { unlockedBy: 'admin' },
                },
            });

            return NextResponse.json({ success: true, user });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error patching user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
