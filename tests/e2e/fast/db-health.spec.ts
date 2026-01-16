import { test, expect } from '@playwright/test';

test.describe('DB Health', () => {
    test('api health reports healthy db and rbac', async ({ request }) => {
        const res = await request.get('/api/health');
        expect(res.ok()).toBe(true);
        const body = await res.json();
        expect(body.status).toBe('healthy');
        const checks = Array.isArray(body.checks) ? body.checks : [];
        const db = checks.find((c: any) => c.name === 'db:connection');
        const rbac = checks.find((c: any) => c.name === 'rbac:tables');
        expect(db?.status).toBe('ok');
        expect(rbac?.status).toBe('ok');
    });
});

