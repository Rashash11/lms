import { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma";
import { hashPassword, RoleKey, enforceNodeWhere } from '@/lib/auth';
import { checkSafetyConstraints } from '@/lib/permissions';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import {
    validateBody,
    validateQuery,
    userSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { jobs } from '@/lib/jobs';
import { z } from 'zod';

// Extended query schema for user list
const listQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED', 'all']).optional(),
    activeRole: z.string().optional(),
});

// Extended create schema for additional fields
const createUserSchema = userSchemas.create.extend({
    roleIds: z.array(z.string().uuid()).optional(),
    excludeFromEmails: z.boolean().optional(),
    grantIds: z.array(z.string().uuid()).optional(),
    denyIds: z.array(z.string().uuid()).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED']).optional(),
    deactivateAt: z.string().optional(),
    nodeId: z.string().uuid().nullable().optional(),
});

/**
 * GET /api/users
 * List all users with pagination and filtering
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'user:read'
    }, async (ctx: GuardedContext) => {
        // 1. Validate query
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, listQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { search, status, activeRole: role, page, limit } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }
        if (role) {
            where.activeRole = role;
        }

        // Apply node scope filtering
        // ADMIN users see all users in their tenant (no node filter)
        // Other roles are restricted to their node
        let scopedWhere = where;
        if (ctx.session.role !== 'ADMIN') {
            scopedWhere = enforceNodeWhere(ctx.session, where, 'nodeId');
        }

        // 3. Fetch users
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: scopedWhere,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    userType: true,
                    roles: true
                },
            }),
            prisma.user.count({ where: scopedWhere }),
        ]);

        // Transform for frontend (remove sensitive data)
        const usersWithRoles = users.map((user: any) => ({
            ...user,
            passwordHash: undefined,
            roles: user.roles.length > 0
                ? user.roles.map((ur: any) => ur.roleKey)
                : [user.activeRole || 'LEARNER'],
        }));

        return apiResponse({
            data: usersWithRoles,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    });
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'user:create',
        auditEvent: 'USER_CREATE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, createUserSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                console.error('User create validation error:', e.message, e.errors);
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const {
            username, email, firstName, lastName, password,
            activeRole: requestedActiveRole, status, nodeId, roleIds, excludeFromEmails,
            grantIds, denyIds
        } = data;

        // 2. Security: Privilege escalation prevention
        const isActorAdmin = ctx.session.role === 'ADMIN';

        // Check if trying to assign ADMIN role
        if (roleIds && roleIds.length > 0) {
            const requestedRoles = await (prisma as any).authRole.findMany({
                where: { id: { in: roleIds } }
            });
            const isAdminRequested = requestedRoles.some((r: any) => r.name === 'ADMIN');

            if (isAdminRequested && !isActorAdmin) {
                return apiError('Only Administrators can assign the ADMIN role', 403);
            }
        }

        // Only ADMIN can set permission overrides
        if ((grantIds?.length || denyIds?.length) && !isActorAdmin) {
            return apiError('Only administrators can set permission overrides', 403);
        }

        // 3. Check for existing user
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email: email.toLowerCase() }, { username }] },
        });

        if (existingUser) {
            return apiError('User with this email or username already exists', 400);
        }

        // 4. Hash password
        let passwordHash: string;
        if (password) {
            passwordHash = await hashPassword(password);
        } else {
            const randomPassword = `Temp${Math.random().toString(36).slice(2)}!1`;
            passwordHash = await hashPassword(randomPassword);
        }

        // 5. Resolve permission overrides
        let grants: string[] = [];
        let denies: string[] = [];

        if (grantIds && grantIds.length > 0) {
            const perms = await (prisma as any).authPermission.findMany({
                where: { id: { in: grantIds } }
            });
            grants = perms.map((p: any) => p.fullPermission || p.name);
        }
        if (denyIds && denyIds.length > 0) {
            const perms = await (prisma as any).authPermission.findMany({
                where: { id: { in: denyIds } }
            });
            denies = perms.map((p: any) => p.fullPermission || p.name);
        }

        // 6. Final active role
        let finalActiveRole: RoleKey = (requestedActiveRole as RoleKey) || 'LEARNER';

        // 7. Create user in transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    tenantId: ctx.session.tenantId,
                    username,
                    email: email.toLowerCase(),
                    firstName,
                    lastName,
                    passwordHash,
                    status: status || 'ACTIVE',
                    excludeFromEmails: excludeFromEmails || false,
                    activeRole: finalActiveRole,
                    nodeId: nodeId || null,
                    rbacOverrides: { grants, denies }
                } as any,
            });

            // Assign roles
            if (roleIds && roleIds.length > 0) {
                for (const rid of roleIds) {
                    const role = await (tx as any).authRole.findUnique({ where: { id: rid } });
                    if (role) {
                        await (tx as any).userRole.create({
                            data: { userId: newUser.id, roleKey: role.name, tenantId: ctx.session.tenantId }
                        });
                    }
                }
            }

            return newUser;
        });

        // 8. Queue timeline event
        jobs.timeline.addEvent({
            userId: user.id,
            tenantId: ctx.session.tenantId,
            eventType: 'USER_CREATED',
            details: { email: user.email, createdBy: ctx.session.userId },
        }).catch(console.error);

        return apiResponse({ ...user, passwordHash: undefined }, 201);
    });
}

/**
 * DELETE /api/users
 * Bulk delete users
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'user:delete',
        auditEvent: 'USER_DELETE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No user IDs provided', 400);
        }

        // Safety check for each target
        const targets = await prisma.user.findMany({
            where: { id: { in: ids } },
            include: { roles: true }
        });

        for (const target of targets) {
            const isSafe = await checkSafetyConstraints(ctx.session, 'delete', target.id);
            if (!isSafe) {
                return apiError('Safety constraint violation', 403);
            }
        }

        // Delete user roles first
        await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });

        // Delete users
        const result = await prisma.user.deleteMany({
            where: { id: { in: ids } },
        });

        return apiResponse({ success: true, deleted: result.count });
    });
}

/**
 * PATCH /api/users
 * Bulk update users (activate/deactivate/unlock)
 */
export async function PATCH(request: NextRequest) {
    return withGuard(request, {
        permission: 'user:update',
        auditEvent: 'USER_UPDATE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids, action, status: newStatus, roleIds } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No user IDs provided', 400);
        }

        // Safety: non-admins cannot modify admin accounts
        if (ctx.session.role !== 'ADMIN') {
            const adminCount = await prisma.userRole.count({
                where: { userId: { in: ids }, roleKey: 'ADMIN' as any }
            });
            if (adminCount > 0) {
                return apiError('Cannot modify Administrator accounts', 403);
            }
        }

        // Determine update data
        if (action === 'assign_roles') {
            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                return apiError('No role IDs provided', 400);
            }

            // Sync roles for each user
            const roles = await (prisma as any).authRole.findMany({
                where: { id: { in: roleIds } }
            });

            if (roles.length === 0) {
                return apiError('Valid roles not found', 400);
            }

            // Transactional update for roles
            await prisma.$transaction(async (tx) => {
                // Delete existing roles for these users
                await (tx as any).userRole.deleteMany({
                    where: {
                        tenantId: ctx.session.tenantId,
                        userId: { in: ids }
                    }
                });

                // Add new roles
                for (const userId of ids) {
                    for (const role of roles) {
                        await (tx as any).userRole.create({
                            data: { userId, roleKey: role.name, tenantId: ctx.session.tenantId }
                        });
                    }
                }
            });

            return apiResponse({ success: true, message: `Roles assigned to ${ids.length} users` });
        }

        let updateData: any = {};
        if (action === 'activate') {
            updateData = { status: 'ACTIVE' };
        } else if (action === 'deactivate') {
            updateData = { status: 'INACTIVE' };
        } else if (action === 'unlock') {
            updateData = { lockedUntil: null, failedLoginAttempts: 0, status: 'ACTIVE' };
        } else if (newStatus) {
            updateData = { status: newStatus };
        } else {
            return apiError('Invalid action', 400);
        }

        const result = await prisma.user.updateMany({
            where: { id: { in: ids } },
            data: updateData,
        });

        return apiResponse({ success: true, updated: result.count });
    });
}

