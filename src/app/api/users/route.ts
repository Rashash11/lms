import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getUserPermissions } from "@/lib/permissions";
import { hashPassword, validatePasswordPolicy, RoleKey, requireAuth } from '@/lib/auth';
import { can, checkSafetyConstraints } from '@/lib/permissions';
import { z } from 'zod';

const createUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    password: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED']).optional(),
    roleIds: z.array(z.string()).optional(), // Changed from number to string for UUIDs
    nodeId: z.string().nullable().optional(), // Changed from number to string for UUIDs
    role: z.enum(['ADMIN', 'INSTRUCTOR', 'LEARNER', 'SUPER_INSTRUCTOR']).optional(),
    excludeFromEmails: z.boolean().optional(),
    bio: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    deactivateAt: z.string().optional(),
});


// GET all users with roles
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'user:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:read' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const role = searchParams.get('role') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

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

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    userType: true,
                    roles: true
                },
            }),
            prisma.user.count({ where }),
        ]);

        // Transform for frontend
        const usersWithRoles = users.map((user: any) => ({
            ...user,
            passwordHash: undefined,
            roles: user.roles.length > 0
                ? user.roles.map((ur: any) => ur.roleKey)
                : [user.role || 'LEARNER'],
        }));

        return NextResponse.json({
            users: usersWithRoles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: any) {
        // Handle authentication errors specifically
        if (error?.name === 'AuthError' || error?.statusCode === 401) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: error.message || 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching users:', error);
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: 'Failed to fetch users',
            message: isDev ? error.message : undefined,
            code: error.code
        }, { status: 500 });
    }
}

// POST create new user with roles and optional overrides
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'user:create'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:create' }, { status: 403 });
        }

        const body = await request.json();

        // 1. Validate basic input
        const validation = createUserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const {
            username, email, firstName, lastName, password, status, excludeFromEmails,
            roleIds, nodeId, role
        } = validation.data;

        // 2. Security Checks & Privilege Escalation Prevention
        const isActorAdmin = session.role === 'ADMIN';

        // Check assigned roles
        if (roleIds && roleIds.length > 0) {
            let requestedRoles: any[];
            try {
                requestedRoles = await (prisma as any).authRole.findMany({ where: { id: { in: roleIds } } });
            } catch (e) {
                requestedRoles = await prisma.$queryRaw<any[]>`SELECT * FROM auth_role WHERE id IN (${roleIds.join(',')})`;
            }
            const isAdminRequested = requestedRoles.some(r => r.name === 'ADMIN');

            if (isAdminRequested && !isActorAdmin) {
                return NextResponse.json({ error: 'FORBIDDEN', reason: 'Only Administrators can assign the ADMIN role.' }, { status: 403 });
            }

            // check user:assign_role permission
            if (!(await can(session, 'user:assign_role'))) {
                return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:assign_role' }, { status: 403 });
            }
        }

        // 3. User Existence & Password
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email: email.toLowerCase() }, { username }] },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 400 });
        }

        let passwordHash: string;
        if (password) {
            // Simplified policy check since validatePasswordPolicy might be missing
            if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
            passwordHash = await hashPassword(password);
        } else {
            const randomPassword = `Temp${Math.random().toString(36).slice(2)}!1`;
            passwordHash = await hashPassword(randomPassword);
        }

        // Resolve permission overrides (map IDs to names for persistence)
        const grantIds = body.grantIds || [];
        const denyIds = body.denyIds || [];
        let grants: string[] = [];
        let denies: string[] = [];

        if (grantIds.length > 0) {
            try {
                const perms = await (prisma as any).authPermission.findMany({ where: { id: { in: grantIds } } });
                grants = perms.map((p: any) => p.fullPermission);
            } catch (e) {
                const rows = await prisma.$queryRaw<any[]>`SELECT "fullPermission" FROM auth_permission WHERE id IN (${grantIds.join(',')})`;
                grants = rows.map(r => r.fullPermission);
            }
        }
        if (denyIds.length > 0) {
            try {
                const perms = await (prisma as any).authPermission.findMany({ where: { id: { in: denyIds } } });
                denies = perms.map((p: any) => p.fullPermission);
            } catch (e) {
                const rows = await prisma.$queryRaw<any[]>`SELECT "fullPermission" FROM auth_permission WHERE id IN (${denyIds.join(',')})`;
                denies = rows.map(r => r.fullPermission);
            }
        }

        const rbacOverrides = { grants, denies };

        // 4. Determine the activeRole based on assigned roles or default
        let activeRole: RoleKey = (role as RoleKey) || 'LEARNER';

        // If RBAC roles are being assigned, use the first one as activeRole
        if (roleIds && roleIds.length > 0) {
            try {
                const firstRole = await (prisma as any).authRole.findUnique({ where: { id: roleIds[0] } });
                if (firstRole && firstRole.name) {
                    // Map auth role name to RoleKey enum
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
                    activeRole = roleMapping[firstRole.name] || activeRole;
                }
            } catch (e) {
                console.warn('Could not fetch role for activeRole determination:', e);
            }
        }

        // 5. Create User Transaction
        const user = await prisma.$transaction(async (tx) => {
            // Create user
            const newUser = await tx.user.create({
                data: {
                    username,
                    email: email.toLowerCase(),
                    firstName,
                    lastName,
                    passwordHash,
                    status: (status as any) || 'ACTIVE',
                    excludeFromEmails: excludeFromEmails || false,
                    role: activeRole,
                    nodeId: body.nodeId || null,
                    rbacOverrides: rbacOverrides
                } as any,
            });

            // Assign Roles
            if (roleIds && roleIds.length > 0) {
                for (const rid of roleIds) {
                    let r: any;
                    try {
                        r = await (tx as any).authRole.findUnique({ where: { id: rid } });
                    } catch (e) {
                        const rows = await tx.$queryRaw<any[]>`SELECT * FROM auth_role WHERE id = ${rid}`;
                        r = rows[0];
                    }
                    if (r) {
                        await (tx as any).userRole.create({
                            data: {
                                userId: newUser.id,
                                roleKey: r.name as any
                            }
                        });
                    }
                }
            }

            return newUser;
        });

        // 5. Audit Log (Timeline)
        await prisma.timelineEvent.create({
            data: {
                userId: user.id,
                eventType: 'USER_CREATED',
                details: {
                    email: user.email,
                    roles: roleIds,
                    nodeId
                },
            },
        });

        return NextResponse.json({ ...user, passwordHash: undefined }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: 'Failed to create user',
            message: isDev ? error.message : undefined,
            code: error.code
        }, { status: 500 });
    }
}

// DELETE bulk delete users
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'user:delete'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:delete' }, { status: 403 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
        }

        // Fetch targets to check safety constraints
        const targets = await prisma.user.findMany({
            where: { id: { in: ids } },
            include: { roles: true }
        });

        for (const target of targets) {
            const isSafe = await checkSafetyConstraints(session, 'delete', target.id);
            if (!isSafe) {
                return NextResponse.json({ error: 'FORBIDDEN', reason: 'Safety constraint violation' }, { status: 403 });
            }
        }

        // Delete user roles first (cascading normally works, but being explicit here)
        await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });

        // Delete users
        const result = await prisma.user.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({
            success: true,
            deleted: result.count
        });
    } catch (error: any) {
        console.error('Error bulk deleting users:', error);
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: 'Failed to delete users',
            message: isDev ? error.message : undefined
        }, { status: 500 });
    }
}

// PATCH bulk update users
export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'user:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:update' }, { status: 403 });
        }

        const body = await request.json();
        const { ids, action, status: newStatus } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
        }

        // Safety check for ADMIN protection
        if (session.role !== 'ADMIN') {
            const adminCount = await prisma.userRole.count({
                where: {
                    userId: { in: ids },
                    roleKey: 'ADMIN' as any
                }
            });
            if (adminCount > 0) {
                return NextResponse.json({ error: 'FORBIDDEN', reason: 'You do not have permission to modify Administrator accounts.' }, { status: 403 });
            }
        }

        let updateData: any = {};

        if (action === 'activate') {
            updateData = { status: 'ACTIVE' };
        } else if (action === 'deactivate') {
            updateData = { status: 'INACTIVE' };
        } else if (action === 'unlock') {
            updateData = {
                lockedUntil: null,
                failedLoginAttempts: 0,
                status: 'ACTIVE'
            };
        } else if (newStatus) {
            updateData = { status: newStatus };
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const result = await prisma.user.updateMany({
            where: { id: { in: ids } },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            updated: result.count
        });
    } catch (error) {
        console.error('Error bulk updating users:', error);
        return NextResponse.json({ error: 'Failed to update users' }, { status: 500 });
    }
}
