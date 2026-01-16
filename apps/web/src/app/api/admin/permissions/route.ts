import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, GuardedContext } from '@/lib/api-guard';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';
/**
 * GET /api/admin/permissions
 * List all system permissions
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'permissions:read',
        roles: ['ADMIN'],
    }, async (ctx: GuardedContext) => {
        let permissions: any[];
        try {
            permissions = await (prisma as any).authPermission.findMany({
                orderBy: { name: 'asc' }
            });
        } catch {
            permissions = await prisma.$queryRaw`SELECT * FROM auth_permission ORDER BY name ASC`;
        }

        const response = NextResponse.json({ success: true, data: permissions });
        response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
        return response;
    });
}
