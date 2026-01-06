import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordPolicy, RoleKey, requireAuth } from '@/lib/auth';
import { can, checkSafetyConstraints } from '@/lib/permissions';
import { z } from 'zod';

const updateUserSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    password: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED', 'LOCKED']).optional(),
    roles: z.array(z.string()).optional(),
    roleIds: z.array(z.string()).optional(),
    nodeId: z.string().nullable().optional(),
    grantIds: z.array(z.string()).optional(),
    denyIds: z.array(z.string()).optional(),
    excludeFromEmails: z.boolean().optional(),
    avatar: z.string().optional(),
});

// GET single user with roles
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'user:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:read' }, { status: 403 });
        }

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
        const session = await requireAuth();
        if (!(await can(session, 'user:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:update' }, { status: 403 });
        }

        const body = await request.json();

        const validation = updateUserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const {
            firstName, lastName, email, username, status,
            roles, roleIds, nodeId, grantIds, denyIds,
            password, excludeFromEmails, avatar
        } = validation.data;

        // Fetch target
        const target = await prisma.user.findUnique({
            where: { id: params.id },
            include: { roles: true }
        });

        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Safety checks
        const isSafe = await checkSafetyConstraints(session, 'update', target.id);
        if (!isSafe) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Safety constraint violation' }, { status: 403 });
        }

        // Safety constraint: Super Instructor cannot assign ADMIN role
        if (session.role === 'SUPER_INSTRUCTOR' && (roles?.includes('ADMIN') || roleIds?.some(id => id.toLowerCase() === 'admin'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'You do not have permission to grant Administrator privileges.' }, { status: 403 });
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
        if (nodeId !== undefined) updateData.nodeId = nodeId;

        // Process RBAC Overrides if provided
        if (grantIds !== undefined || denyIds !== undefined) {
            let grants: string[] = [];
            let denies: string[] = [];

            if (grantIds && grantIds.length > 0) {
                const rows = await prisma.$queryRaw<any[]>`SELECT "fullPermission" FROM auth_permission WHERE id IN (${grantIds.join(',')})`;
                grants = rows.map(r => r.fullPermission);
            }
            if (denyIds && denyIds.length > 0) {
                const rows = await prisma.$queryRaw<any[]>`SELECT "fullPermission" FROM auth_permission WHERE id IN (${denyIds.join(',')})`;
                denies = rows.map(r => r.fullPermission);
            }
            updateData.rbacOverrides = { grants, denies };
        }

        // Update password if provided
        if (password) {
            updateData.passwordHash = await hashPassword(password);
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            include: { roles: true },
        });

        // Update roles if provided (either via names or IDs)
        const finalRoleIds = roleIds || [];
        if (roles && roles.length > 0 && finalRoleIds.length === 0) {
            // Map names to IDs if only names provided
            const roleObjects = await (prisma as any).authRole.findMany({ where: { name: { in: roles } } });
            roleObjects.forEach((r: any) => finalRoleIds.push(r.id));
        }

        if (finalRoleIds.length > 0) {
            await prisma.userRole.deleteMany({ where: { userId: params.id } });

            // Determine new activeRole from first assigned role
            let newActiveRole: RoleKey | undefined;

            for (const rid of finalRoleIds) {
                const r = await (prisma as any).authRole.findUnique({ where: { id: rid } });
                if (r) {
                    await prisma.userRole.create({
                        data: {
                            userId: params.id,
                            roleKey: r.name as any
                        }
                    });

                    // Set activeRole from first role if not yet set
                    if (!newActiveRole) {
                        const roleMapping: Record<string, RoleKey> = {
                            'ADMIN': 'ADMIN',
                            'Administrator': 'ADMIN',
                            'SUPER_INSTRUCTOR': 'SUPER_INSTRUCTOR',
                            'Super Instructor': 'SUPER_INSTRUCTOR',
                            'INSTRUCTOR': 'INSTRUCTOR',
                            'Instructor': 'INSTRUCTOR',
                            'LEARNER': 'LEARNER',
                            'Learner': 'LEARNER',
                        };
                        newActiveRole = roleMapping[r.name];
                    }
                }
            }

            // Update activeRole if we determined a new one
            if (newActiveRole) {
                await prisma.user.update({
                    where: { id: params.id },
                    data: { role: newActiveRole }
                });
            }
        }

        return NextResponse.json({
            ...user,
            passwordHash: undefined,
            roles: user.roles.map(r => r.roleKey),
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
        const session = await requireAuth();
        if (!(await can(session, 'user:delete'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:delete' }, { status: 403 });
        }

        // Fetch target to check safety constraints
        const target = await prisma.user.findUnique({
            where: { id: params.id },
            include: { roles: { select: { roleKey: true } } }
        });

        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isSafe = await checkSafetyConstraints(session, 'delete', target.id);
        if (!isSafe) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Safety constraint violation' }, { status: 403 });
        }

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
        const session = await requireAuth();
        if (!(await can(session, 'user:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:update' }, { status: 403 });
        }

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
