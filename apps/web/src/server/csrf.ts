import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * CSRF Protection Module
 * 
 * Implements Double Submit Cookie pattern:
 * 1. Server sets a CSRF token in a cookie
 * 2. Client must include the same token in a header
 * 3. Server validates both match
 * 
 * This protects against CSRF attacks because:
 * - Attackers can't read the cookie value due to SameSite
 * - Attackers can't set custom headers on cross-origin requests
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCsrfToken(): string {
    const array = new Uint8Array(CSRF_TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token for the current session
 */
export async function getCsrfToken(): Promise<string> {
    const cookieStore = await cookies();
    let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!token) {
        token = generateCsrfToken();
    }

    return token;
}

/**
 * Set CSRF cookie on response
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
    response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
    return response;
}

/**
 * Validate CSRF token from request
 * Returns true if valid, throws error if invalid
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
    // Skip CSRF check for safe methods
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (safeMethod) {
        return true;
    }

    // Skip in test mode
    if (process.env.SKIP_CSRF === '1') {
        return true;
    }

    // Get token from cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    // Both must be present and match
    if (!cookieToken || !headerToken) {
        throw new CsrfError('CSRF token missing');
    }

    if (cookieToken !== headerToken) {
        throw new CsrfError('CSRF token mismatch');
    }

    return true;
}

/**
 * CSRF Error class
 */
export class CsrfError extends Error {
    public statusCode = 403;

    constructor(message: string) {
        super(message);
        this.name = 'CsrfError';
    }
}

/**
 * Middleware to validate CSRF on mutation requests
 * Use this in API routes that modify data
 */
export async function withCsrfProtection<T>(
    request: NextRequest,
    handler: () => Promise<T>
): Promise<T | NextResponse> {
    try {
        await validateCsrfToken(request);
        return handler();
    } catch (error) {
        if (error instanceof CsrfError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }
        throw error;
    }
}

/**
 * API route to get a fresh CSRF token
 * Client should call this on app init and store the token
 * 
 * Usage:
 * export async function GET() {
 *   return getCsrfTokenResponse();
 * }
 */
export async function getCsrfTokenResponse(): Promise<NextResponse> {
    const token = generateCsrfToken();

    const response = NextResponse.json({
        csrfToken: token
    });

    return setCsrfCookie(response, token);
}
