import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateQuery, ValidationError } from '@/lib/validations';
import { z } from 'zod';

// Query schema
const querySchema = z.object({
    nodeId: z.string().uuid().optional(),
    roleIds: z.string().optional().transform(v => v?.split(',').filter(id => id.length > 0) || []),
    grantIds: z.string().optional().transform(v => v?.split(',').filter(id => id.length > 0) || []),
    denyIds: z.string().optional().transform(v => v?.split(',').filter(id => id.length > 0) || []),
});

/**
 * GET /api/admin/users/preview-permissions
 * Preview effective permissions for a user
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'user:read',
        roles: ['ADMIN'],
    }, async (ctx: GuardedContext) => {
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, querySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { nodeId, roleIds, grantIds, denyIds } = query;
        const effectivePermissions = new Set<string>();

        // 1. Permissions from roles
        if (roleIds.length > 0) {
            try {
                const rolePerms = await (prisma as any).authRolePermission.findMany({
                    where: { roleId: { in: roleIds } },
                    include: { permission: true }
                });
                rolePerms.forEach((rp: any) => effectivePermissions.add(rp.permission.fullPermission));
            } catch {
                const rawPerms = await prisma.$queryRaw<any[]>`
                    SELECT p."fullPermission" 
                    FROM auth_permission p
                    JOIN auth_role_permission rp ON p.id = rp."permissionId"
                    WHERE rp."roleId" IN (${roleIds.join(',')})
                `;
                rawPerms.forEach(p => effectivePermissions.add(p.fullPermission));
            }
        }

        // 2. Add grants
        if (grantIds.length > 0) {
            try {
                const grants = await (prisma as any).authPermission.findMany({
                    where: { id: { in: grantIds } }
                });
                grants.forEach((p: any) => effectivePermissions.add(p.fullPermission));
            } catch {
                const rawGrants = await prisma.$queryRaw<any[]>`
                    SELECT "fullPermission" FROM auth_permission WHERE id IN (${grantIds.join(',')})
                `;
                rawGrants.forEach(p => effectivePermissions.add(p.fullPermission));
            }
        }

        // 3. Subtract denies
        if (denyIds.length > 0) {
            try {
                const denies = await (prisma as any).authPermission.findMany({
                    where: { id: { in: denyIds } }
                });
                denies.forEach((p: any) => effectivePermissions.delete(p.fullPermission));
            } catch {
                const rawDenies = await prisma.$queryRaw<any[]>`
                    SELECT "fullPermission" FROM auth_permission WHERE id IN (${denyIds.join(',')})
                `;
                rawDenies.forEach(p => effectivePermissions.delete(p.fullPermission));
            }
        }

        return apiResponse({
            permissions: Array.from(effectivePermissions),
            nodeId
        });
    });
}
