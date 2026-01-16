import { test, expect } from './e2eTest';
import { loadE2ESeedFixtures } from '../helpers/seed';

test.describe('Auth', () => {
    test('seeded users can authenticate and load /api/me', async ({ request }) => {
        const seed = loadE2ESeedFixtures();
        const roles = [
            { name: 'admin', email: seed.adminAEmail },
            { name: 'super-instructor', email: seed.superInstructorAEmail },
            { name: 'instructor', email: seed.instructorAEmail },
            { name: 'learner', email: seed.learnerAEmail },
        ] as const;

        for (const r of roles) {
            const loginRes = await request.post('/api/auth/login', {
                data: { email: r.email, password: seed.testPassword },
            });
            expect(loginRes.status(), `login ${r.name}`).toBe(200);
            const loginJson = await loginRes.json();
            expect(loginJson.ok, `login ok ${r.name}`).toBeTruthy();

            const meRes = await request.get('/api/me');
            expect(meRes.status(), `/api/me ${r.name}`).toBe(200);
            const meJson = await meRes.json();
            expect(meJson.user?.email, `/api/me email ${r.name}`).toBe(r.email);
        }
    });
});
