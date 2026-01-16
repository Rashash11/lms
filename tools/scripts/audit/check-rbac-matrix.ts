
import 'dotenv/config'; // Load env vars
import { signAccessToken } from '../src/lib/auth-definitions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ROLES = ['ADMIN', 'INSTRUCTOR', 'LEARNER'] as const;
type Role = typeof ROLES[number];

interface EndpointCheck {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body?: any;
    expected: Record<Role, number>; // Expected status code per role
}

const CHECKS: EndpointCheck[] = [
    {
        method: 'GET',
        path: '/api/users', // Was /api/admin/users
        expected: {
            ADMIN: 200,
            INSTRUCTOR: 200, // Instructors can read users
            LEARNER: 403
        }
    },
    {
        method: 'POST',
        path: '/api/courses',
        body: { title: 'RBAC Test Course', code: `RBAC-${Date.now()}` }, // Randomized code
        expected: {
            ADMIN: 201, // Or 200
            INSTRUCTOR: 201,
            LEARNER: 403
        }
    },
    {
        method: 'GET',
        path: '/api/admin/settings', // Was /api/settings
        expected: {
            ADMIN: 200,
            INSTRUCTOR: 403,
            LEARNER: 403
        }
    }
];

const USERS = {
    ADMIN: { id: '32199d74-d654-4646-a050-ec804382adf8', email: 'admin-a@test.local' },
    INSTRUCTOR: { id: '030673eb-5d19-44a1-9916-373994715700', email: 'instructor-a@test.local' },
    LEARNER: { id: 'ee90d301-d784-4859-9f16-06fac99fadc8', email: 'learner-a@test.local' }
};

const TENANT_ID = '62143487-327a-4280-96a4-f21911acae95';

async function getAuthHeaders(role: Role) {
    const user = USERS[role];

    // We don't need DB connection if we use existing seeded users
    // The server will validate the token against the DB

    const token = await signAccessToken({
        userId: user.id,
        email: user.email,
        activeRole: role,
        tenantId: TENANT_ID,
        tokenVersion: 0
    });

    return {
        'Cookie': `session=${token}; csrf-token=rbac-matrix-csrf`,
        'x-csrf-token': 'rbac-matrix-csrf',
        'Content-Type': 'application/json'
    };
}

async function run() {
    console.log(`Starting RBAC Matrix Check against ${BASE_URL}...`);
    let failures = 0;

    for (const check of CHECKS) {
        console.log(`\nChecking ${check.method} ${check.path}...`);

        for (const role of ROLES) {
            const headers = await getAuthHeaders(role);
            const expectedStatus = check.expected[role];

            try {
                // Dynamic body for uniqueness
                let body = check.body;
                if (check.method === 'POST' && check.path === '/api/courses') {
                    body = { ...check.body, code: `RBAC-${Date.now()}-${Math.floor(Math.random() * 1000)}` };
                }

                const res = await fetch(`${BASE_URL}${check.path}`, {
                    method: check.method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined
                });

                // Allow 200 or 201 for success
                const isSuccess = (expectedStatus >= 200 && expectedStatus < 300)
                    ? (res.status >= 200 && res.status < 300)
                    : res.status === expectedStatus;

                // Also handle redirects (307/308) as 403 effectively for API
                // But API routes usually return JSON. Middleware might redirect.
                // If middleware redirects to /login or /admin, we count it as Access Denied (effectively 403 for our purpose if we expect 403)

                let pass = isSuccess;
                if (!pass && expectedStatus === 403 && (res.status === 307 || res.status === 302)) {
                    pass = true; // Redirect is a form of denial
                }

                if (pass) {
                    console.log(`  ✅ [${role}] Got ${res.status} (Expected ${expectedStatus})`);
                } else {
                    console.error(`  ❌ [${role}] Got ${res.status} (Expected ${expectedStatus})`);
                    failures++;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`  ❌ [${role}] Network Error: ${message}`);
                failures++;
            }
        }
    }

    console.log(`\nDone. Failures: ${failures}`);
    if (failures > 0) process.exit(1);
}

run();
