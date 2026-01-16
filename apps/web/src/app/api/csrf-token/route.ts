import { NextRequest } from 'next/server';
import { getCsrfTokenResponse } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf-token
 * 
 * Returns a CSRF token for the client to use in subsequent requests.
 * The token is also set as a cookie.
 * 
 * Client Usage:
 * 1. Call this endpoint on app initialization
 * 2. Store the returned csrfToken
 * 3. Include it in the x-csrf-token header for all POST/PUT/DELETE requests
 */
export async function GET(request: NextRequest) {
    // Public endpoint, no guard needed, or empty guard
    // Actually, getting a CSRF token should be public.
    return getCsrfTokenResponse();
}
