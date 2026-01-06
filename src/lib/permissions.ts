import { prisma } from "@/lib/prisma";
import { AuthError, AuthContext, requireAuth } from "./auth";
import { DEFAULT_ROLE_PERMISSIONS } from "./permissions-registry";

// Permission cache: userId -> { permissions: string[], expiresAt: number }
const permissionCache = new Map<string, { permissions: string[]; expiresAt: number }>();
const CACHE_TTL = 60000; // 60 seconds

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function getUserPermissions(userId: string, nodeId?: number): Promise<string[]> {
    // Check cache
    const cached = permissionCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.permissions;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            roles: true,
        },
    });

    if (!user) {
        throw new AuthError("User not found", 404);
    }

    // Aggregate roles: the mapped 'role' column + multiple roles from user_roles table
    const roleKeys = new Set<string>();
    if ((user as any).role) roleKeys.add((user as any).role as string);
    if ((user as any).roles) {
        ((user as any).roles as any[]).forEach(ur => roleKeys.add(ur.roleKey as string));
    }

    const roleNames = Array.from(roleKeys);

    // Try to get permissions from database first
    let permissions: string[] = [];
    try {
        const rolePermissions = await (prisma as any).authRolePermission.findMany({
            where: {
                role: {
                    name: { in: roleNames },
                },
            },
            include: {
                permission: {
                    select: {
                        fullPermission: true,
                    },
                },
            },
        });
        permissions = Array.from(new Set(rolePermissions.map((rp: any) => rp.permission.fullPermission)));
    } catch (err) {
        // DB query failed - only fallback in development
        if (!IS_PRODUCTION) {
            console.warn('[RBAC] DB query failed, using fallback permissions (DEV ONLY)');
            const role = (user as any).role as keyof typeof DEFAULT_ROLE_PERMISSIONS;
            permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
        } else {
            console.error('[RBAC] DB query failed in PRODUCTION - denying all permissions');
            permissions = [];
        }
    }

    // Apply Overrides (Grants/Denies)
    try {
        const overrides = (user as any).rbacOverrides as { grants?: string[], denies?: string[] } | null;
        if (overrides) {
            if (overrides.grants) {
                overrides.grants.forEach(p => {
                    if (!permissions.includes(p)) permissions.push(p);
                });
            }
            if (overrides.denies) {
                const denySet = new Set(overrides.denies);
                permissions = permissions.filter(p => !denySet.has(p));
            }
        }
    } catch (err) {
        console.error('[RBAC] Failed to apply overrides:', err);
    }

    // STRICT MODE: In production, if no DB permissions found, deny all (no fallback)
    if (IS_PRODUCTION && permissions.length === 0) {
        // Try one more time to get from DB (in case tables exist but empty for this role)
        const roleExists = await (prisma as any).authRole.findFirst({ where: { name: { in: roleNames } } });
        if (!roleExists) {
            console.error(`[RBAC] PRODUCTION: Roles "${roleNames.join(',')}" not found in auth_role table. Denying all permissions.`);
        }
        // Still return empty - strict mode means DB is the only source of truth
    }

    // In development, fallback to hardcoded if DB returns nothing
    if (!IS_PRODUCTION && permissions.length === 0) {
        console.warn(`[RBAC] Using fallback permissions for roles: ${roleNames.join(',')} (DEV ONLY)`);
        for (const roleName of roleNames) {
            const role = roleName as keyof typeof DEFAULT_ROLE_PERMISSIONS;
            const fallback = DEFAULT_ROLE_PERMISSIONS[role] || [];
            fallback.forEach(p => {
                if (!permissions.includes(p)) permissions.push(p);
            });
        }
    }

    // Update cache
    permissionCache.set(userId, {
        permissions,
        expiresAt: Date.now() + CACHE_TTL,
    });

    return permissions;
}

// can() accepts either AuthContext or userId string for flexibility
export async function can(
    sessionOrUserId: AuthContext | string,
    permission: string,
    nodeId?: number
): Promise<boolean> {
    const userId = typeof sessionOrUserId === 'string'
        ? sessionOrUserId
        : sessionOrUserId.userId;
    const effectiveNodeId = typeof sessionOrUserId === 'object'
        ? sessionOrUserId.nodeId ?? nodeId
        : nodeId;

    const permissions = await getUserPermissions(userId, effectiveNodeId);
    return permissions.includes(permission);
}

// requirePermission() accepts either AuthContext or userId
export async function requirePermission(
    permission: string,
    sessionOrUserId: AuthContext | string,
    nodeId?: number
): Promise<void> {
    const hasPermission = await can(sessionOrUserId, permission, nodeId);

    if (!hasPermission) {
        throw new AuthError(`Missing permission: ${permission}`, 403);
    }
}

// Helper to clear cache (for testing or logout)
export function clearPermissionCache(userId?: string): void {
    if (userId) {
        permissionCache.delete(userId);
    } else {
        permissionCache.clear();
    }
}

// Convenience wrapper for API routes - authenticates AND checks permission
export async function withPermission(permission: string): Promise<AuthContext> {
    const context = await requireAuth();
    await requirePermission(permission, context);
    return context;
}

// Stub for safety constraints (for backward compatibility)
export async function checkSafetyConstraints(
    session: AuthContext,
    action: string,
    targetUserId?: string
): Promise<boolean> {
    // ADMIN can do anything
    if (session.role === 'ADMIN') return true;

    // For now, allow if they have the permission
    return true;
}
