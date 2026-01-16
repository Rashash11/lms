// tests/helpers/tenantIsolation.ts
// Helper to test tenant isolation. Attempts to access a resource belonging to another tenant and expects a 404.
import { loginAs, authFetch } from './authHelper';
import { expect } from '@playwright/test';

/**
 * Verify that a user from tenantA cannot read a resource from tenantB.
 * `resourceUrl` should be the absolute URL to the resource belonging to tenantB.
 */
export async function expectCrossTenantReadForbidden(resourceUrl: string, tenantAUser: { email: string; password: string }) {
    const session = await loginAs(tenantAUser.email, tenantAUser.password);
    const res = await authFetch(resourceUrl, session);
    // According to non‑leak policy we expect 404 (not found) rather than 403.
    expect(res.status).toBe(404);
}

/**
 * Verify that a user from tenantA cannot write to a resource belonging to tenantB.
 * `resourceUrl` is the endpoint for the write operation (POST/PUT/DELETE).
 */
export async function expectCrossTenantWriteForbidden(
    method: 'POST' | 'PUT' | 'DELETE',
    resourceUrl: string,
    body: any,
    tenantAUser: { email: string; password: string }
) {
    const session = await loginAs(tenantAUser.email, tenantAUser.password);
    const res = await authFetch(resourceUrl, session, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    expect(res.status).toBe(404);
}
