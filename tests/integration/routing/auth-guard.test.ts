
import { describe, it, expect } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { GET as usersGet } from '@/app/api/users/route';
import { GET as coursesGet } from '@/app/api/courses/route';
import { GET as adminSettingsGet } from '@/app/api/admin/settings/route';
import { GET as instructorCoursesGet } from '@/app/api/instructor/courses/route';
import { GET as learnerProgressGet } from '@/app/api/learner/progress/route';
import { GET as reportsGet } from '@/app/api/reports/route';

describe('Auth Guard Routing Tests', () => {
    const PROTECTED_ROUTES: Array<{ path: string; handler: any }> = [
        { path: '/api/users', handler: usersGet },
        { path: '/api/courses', handler: coursesGet },
        { path: '/api/admin/settings', handler: adminSettingsGet },
        { path: '/api/instructor/courses', handler: instructorCoursesGet },
        { path: '/api/learner/progress', handler: learnerProgressGet },
        { path: '/api/reports', handler: reportsGet },
    ];

    it('should return 401 JSON for protected routes when not logged in', async () => {
        const client = new ApiClient();
        for (const route of PROTECTED_ROUTES) {
            const res = await client.fetch(route.handler, route.path, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            expect(res.status, `Route ${route.path} should be 401`).toBe(401);

            const contentType = res.headers.get('content-type');
            expect(contentType, `Route ${route.path} should return JSON`).toContain('application/json');

            const body = await res.json();
            expect(body).toHaveProperty('error');
        }
    });
});
