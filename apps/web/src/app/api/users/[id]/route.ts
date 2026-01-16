import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordPolicy, RoleKey } from '@/lib/auth';
import { checkSafetyConstraints } from '@/lib/permissions';
import { withGuard, apiResponse, apiError, GuardedContext } from '@/lib/api-guard';
import { validateBody, ValidationError } from '@/lib/validations';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
const updateUserSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    password: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED', 'LOCKED']).optional(),
    roles: z.array(z.string()).optional(),
    roleIds: z.array(z.string()).optional(),
    branchId: z.string().nullable().optional(),
    grantIds: z.array(z.string()).optional(),
    denyIds: z.array(z.string()).optional(),
    excludeFromEmails: z.boolean().optional(),
    avatar: z.string().optional(),
});

// GET single user with roles
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    return withGuard(request, {
        permission: 'user:read'
    }, async (ctx: GuardedContext) => {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                roles: { select: { roleKey: true } }
            },
        });

        if (!user) {
            return apiError('User not found', 404);
        }

        return apiResponse({
            ...user,
            passwordHash: undefined,
            roles: user.roles.map(r => r.roleKey),
        });
    });
}

// PUT update user with roles
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    return withGuard(request, {
        permission: 'user:update',
        auditEvent: 'USER_UPDATE'
    }, async (ctx: GuardedContext) => {
        let body;
        try {
            body = await validateBody(request, updateUserSchema);
        } catch (e) {
            if (e instanceof ValidationError) return apiError(e.message, 400, e.errors);
            throw e;
        }

        const {
            firstName, lastName, email, username, status,
            roles, roleIds, branchId, grantIds, denyIds,
            password, excludeFromEmails, avatar
        } = body;

        // Fetch target
        const target = await prisma.user.findUnique({
            where: { id },
            include: { roles: true }
        });

        if (!target) {
            return apiError('User not found', 404);
        }

        // Safety checks
        const isSafe = await checkSafetyConstraints(ctx.session, 'update', target.id);
        if (!isSafe) {
            return apiError('Safety constraint violation', 403);
        }

        // Safety constraint: Super Instructor cannot assign ADMIN role
        if (ctx.session.role === 'SUPER_INSTRUCTOR' && (roles?.includes('ADMIN') || roleIds?.some(id => id.toLowerCase() === 'admin'))) {
            return apiError('You do not have permission to grant Administrator privileges.', 403);
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
        if (branchId !== undefined) updateData.branchId = branchId;

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
            where: { id },
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
            await prisma.userRole.deleteMany({
                where: {
                    tenantId: ctx.session.tenantId!,
                    userId: id
                }
            });

            // Determine new activeRole from first assigned role
            let newActiveRole: RoleKey | undefined;

            for (const rid of finalRoleIds) {
                const r = await (prisma as any).authRole.findUnique({ where: { id: rid } });
                if (r) {
                    await prisma.userRole.create({
                        data: {
                            tenantId: ctx.session.tenantId!,
                            userId: id,
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
                    where: { id },
                    data: { activeRole: newActiveRole }
                });
            }
        }

        return apiResponse({
            ...user,
            passwordHash: undefined,
            roles: user.roles.map(r => r.roleKey),
        });
    });
}

// DELETE user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    return withGuard(request, {
        permission: 'user:delete',
        auditEvent: 'USER_DELETE'
    }, async (ctx: GuardedContext) => {
        // Fetch target to check safety constraints
        const target = await prisma.user.findUnique({
            where: { id },
            include: { roles: { select: { roleKey: true } } }
        });

        if (!target) {
            return apiError('User not found', 404);
        }

        const isSafe = await checkSafetyConstraints(ctx.session, 'delete', target.id);
        if (!isSafe) {
            return apiError('Safety constraint violation', 403);
        }

        // Delete user roles first
        await prisma.userRole.deleteMany({
            where: {
                tenantId: ctx.session.tenantId!,
                userId: id
            },
        });

        // Delete user
        await prisma.user.delete({
            where: { id },
        });

        return apiResponse({ success: true });
    });
}

// PATCH unlock user or update specific fields
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    return withGuard(request, {
        permission: 'user:update',
        auditEvent: 'USER_UPDATE'
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { action } = body;

        if (action === 'unlock') {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    lockedUntil: null,
                    failedLoginAttempts: 0,
                    status: 'ACTIVE',
                },
            });

            // Log timeline event
            await prisma.timelineEvent.create({
                data: {
                    tenantId: ctx.session.tenantId,
                    userId: id,
                    eventType: 'USER_UNLOCKED',
                    details: { unlockedBy: ctx.session.userId },
                },
            });

            return apiResponse({ success: true, user });
        }

        return apiError('Invalid action', 400);
    });
}
