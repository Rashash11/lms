export const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, GuardedContext } from '@/lib/api-guard';

/**
 * GET /api/user-types
 * List all user types
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'user_types:read'
    }, async (ctx: GuardedContext) => {
        const userTypes = await prisma.userType.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
            }
        });

        return apiResponse({ data: userTypes });
    });
}
