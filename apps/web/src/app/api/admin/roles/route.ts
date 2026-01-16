import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, GuardedContext } from '@/lib/api-guard';


export const dynamic = 'force-dynamic';
/**
 * GET /api/admin/roles
 * List all system roles
 */
export async function GET(request: NextRequest) {
    console.log('[API] GET /api/admin/roles - Start');
    return withGuard(request, {
        permission: 'roles:read',
        roles: ['ADMIN'],
    }, async (ctx: GuardedContext) => {
        console.log('[API] GET /api/admin/roles - Guard Passed', { user: ctx.session.userId, role: ctx.session.role });
        let roles: any[];
        try {
            roles = await (prisma as any).authRole.findMany({
                orderBy: { name: 'asc' }
            });
            console.log('[API] GET /api/admin/roles - Prisma Success', roles.length);
        } catch (e) {
            console.error('[API] GET /api/admin/roles - Prisma Error, falling back to raw', e);
            roles = await prisma.$queryRaw`SELECT * FROM auth_role ORDER BY name ASC`;
        }

        return apiResponse({ data: roles });
    });
}
