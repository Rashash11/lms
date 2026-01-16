export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { withGuard, apiResponse, GuardedContext } from '@/lib/api-guard';

/**
 * GET /api/organization-nodes
 * Returns a list of all organization nodes (placeholder)
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'organization:read'
    }, async (ctx: GuardedContext) => {
        // The 'organization_node' model is managed via branches
        return apiResponse({ data: [] });
    });
}
