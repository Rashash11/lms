// tests/helpers/rbacMatrix.ts
// Runs a matrix of endpoints against different roles and asserts expected status codes.
import { AuthSession, loginAs, authFetch } from './authHelper';
import { expect } from '@playwright/test'; // using expect from vitest could also work

export interface RBACScenario {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string; // absolute URL
    role: string; // role key e.g., 'SUPER_ADMIN'
    expectedStatus: number;
    body?: any;
}

/**
 * Execute a list of RBAC scenarios.
 */
export async function runRBACMatrix(scenarios: RBACScenario[]) {
    for (const s of scenarios) {
        // Assume we have a test user per role with known credentials.
        const email = `${s.role.toLowerCase()}@example.com`;
        const password = 'Password123!';
        const session = await loginAs(email, password);
        const res = await authFetch(s.url, session, {
            method: s.method,
            headers: { 'Content-Type': 'application/json' },
            body: s.body ? JSON.stringify(s.body) : undefined,
        });
        expect(res.status).toBe(s.expectedStatus);
    }
}
