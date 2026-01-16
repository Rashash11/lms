// tests/helpers/authHelper.ts
// Helper for authentication in tests. Logs in a user for a given role and returns cookies for subsequent requests.
import { execSync } from 'node:child_process';
import { URLSearchParams } from 'url';
// Using built-in fetch available in Node 18+

export interface AuthSession {
    cookies: string; // cookie header string
    tenantId: string;
    userId: string;
}

/**
 * Perform login via the API and capture the httpOnly cookies.
 * Assumes the login endpoint is `/api/auth/login` and returns a Set-Cookie header.
 */
export async function loginAs(email: string, password: string): Promise<AuthSession> {
    const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    } as RequestInit);

    if (!res.ok) {
        throw new Error(`Login failed with status ${res.status}`);
    }

    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) {
        throw new Error('No Set-Cookie header received from login');
    }

    // Extract tenantId and userId from JWT payload (light verification)
    const payload = await res.json();
    const { tenantId, userId } = payload;

    return { cookies: setCookie, tenantId, userId };
}

/**
 * Convenience wrapper to fetch with stored auth cookies.
 */
export async function authFetch(url: string, session: AuthSession, init?: RequestInit) {
    const headers = Object.assign({}, init?.headers, { Cookie: session.cookies });
    return fetch(url, { ...init, headers });
}
