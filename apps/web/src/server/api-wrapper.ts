import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from './auth';
import { withTenantContext } from './tenant-context';

type ApiHandler = (request: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * Higher-order function to wrap API handlers with tenant context.
 * It extracts the tenantId from the user session and sets the AsyncLocalStorage context.
 */
export function withTenant(handler: ApiHandler): ApiHandler {
    return async (request: NextRequest, ...args: any[]) => {
        const session = await getAuthContext();

        // Even if no session, we run the context (tenantId will be undefined)
        // This allows public routes to function, or for the extension specifically to skip as documented.
        return withTenantContext(
            {
                tenantId: session?.tenantId,
                userId: session?.userId
            },
            () => handler(request, ...args)
        );
    };
}
