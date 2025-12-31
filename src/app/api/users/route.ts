import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    roles: z.array(z.enum(['ADMIN', 'INSTRUCTOR', 'LEARNER', 'SUPER_INSTRUCTOR'])).optional(),
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
        if (!can(session, 'user:read')) {
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

        // Try to include roles if the relation exists (Prisma client was regenerated)
        let includeRoles = true;
        let users: any[];
        let total: number;

        try {
            [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        roles: {
                            select: { roleKey: true }
                        }
                    },
                }),
                prisma.user.count({ where }),
            ]);
        } catch (e) {
            // Fallback if roles relation doesn't exist yet
            console.warn('Roles relation not available, using fallback query');
            includeRoles = false;
            [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.user.count({ where }),
            ]);
        }

        // Transform to include role array
        const usersWithRoles = users.map((user: any) => ({
            ...user,
            passwordHash: undefined, // Don't expose password hash
            roles: includeRoles && user.roles ? user.roles.map((r: any) => r.roleKey) : [user.activeRole || 'LEARNER'],
        }));

        return NextResponse.json({
            users: usersWithRoles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST create new user with roles
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!can(session, 'user:create')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:create' }, { status: 403 });
        }

        const body = await request.json();

        // Validate input
        const validation = createUserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { username, email, firstName, lastName, password, status, roles, excludeFromEmails } = validation.data;

        // Safety constraint: Super Instructor cannot create ADMIN
        if (session.activeRole !== 'ADMIN' && roles?.includes('ADMIN')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'You do not have permission to create Administrator accounts.' }, { status: 403 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: email.toLowerCase() }, { username }],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email or username already exists' },
                { status: 400 }
            );
        }

        // Validate password if provided
        let passwordHash: string | undefined;
        if (password) {
            const policyCheck = validatePasswordPolicy(password);
            if (!policyCheck.valid) {
                return NextResponse.json({ error: policyCheck.error }, { status: 400 });
            }
            passwordHash = await hashPassword(password);
        } else {
            // Generate random password if not provided
            const randomPassword = `Temp${Math.random().toString(36).slice(2)}!1`;
            passwordHash = await hashPassword(randomPassword);
        }

        // Create user with roles
        const user = await prisma.user.create({
            data: {
                username,
                email: email.toLowerCase(),
                firstName,
                lastName,
                passwordHash,
                status: status || 'ACTIVE',
                excludeFromEmails: excludeFromEmails || false,
                activeRole: (roles?.[0] as any) || 'LEARNER',
                roles: {
                    create: (roles || ['LEARNER']).map((roleKey: string) => ({
                        roleKey: roleKey as any,
                    })),
                },
            },
            include: { roles: true },
        });

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId: user.id,
                eventType: 'USER_CREATED',
                details: { email: user.email, roles: roles || ['LEARNER'] },
            },
        });

        return NextResponse.json({
            ...user,
            passwordHash: undefined,
            roles: user.roles.map(r => r.roleKey),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

// DELETE bulk delete users
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!can(session, 'user:delete')) {
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
            include: { roles: { select: { roleKey: true } } }
        });

        for (const target of targets) {
            const safety = checkSafetyConstraints(session, {
                userId: target.id,
                activeRole: target.roles[0]?.roleKey as any
            }, 'delete');

            if (!safety.allowed) {
                return NextResponse.json({ error: 'FORBIDDEN', reason: safety.reason }, { status: 403 });
            }
        }

        // Delete user roles first
        await prisma.userRole.deleteMany({
            where: { userId: { in: ids } },
        });

        // Delete users
        const result = await prisma.user.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({
            success: true,
            deleted: result.count
        });
    } catch (error) {
        console.error('Error bulk deleting users:', error);
        return NextResponse.json({ error: 'Failed to delete users' }, { status: 500 });
    }
}

// PATCH bulk update users (activate/deactivate)
export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!can(session, 'user:update')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: user:update' }, { status: 403 });
        }

        const body = await request.json();
        const { ids, action, status: newStatus } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
        }

        // Fetch targets to check safety constraints if updating roles or sensitive fields
        // For simplicity in bulk update, we block any action on ADMINS by non-ADMINS
        if (session.activeRole !== 'ADMIN') {
            const adminCount = await prisma.userRole.count({
                where: {
                    userId: { in: ids },
                    roleKey: 'ADMIN'
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
