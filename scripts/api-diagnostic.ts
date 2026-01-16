import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { NextRequest } from 'next/server';
import { signAccessToken } from '../apps/web/src/server/auth-definitions';
import { GET as healthGET } from '../apps/web/src/app/api/health/route';
import { GET as meGET } from '../apps/web/src/app/api/me/route';
import { GET as dashboardGET } from '../apps/web/src/app/api/dashboard/route';
import { GET as usersGET } from '../apps/web/src/app/api/users/route';
import { GET as coursesGET } from '../apps/web/src/app/api/courses/route';
import { GET as learningPathsGET } from '../apps/web/src/app/api/learning-paths/route';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

function assert(condition: unknown, message: string) {
    if (!condition) throw new Error(message);
}

function readSeed() {
    const seedPath = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'seed.json');
    const raw = fs.readFileSync(seedPath, 'utf-8');
    return JSON.parse(raw) as any;
}

async function callJson(label: string, fn: (req: NextRequest) => Promise<Response>, req: NextRequest) {
    const res = await fn(req);
    const json = await res.json().catch(() => ({}));
    return { label, status: res.status, json };
}

async function main() {
    const seed = readSeed();
    const token = await signAccessToken({
        userId: seed.adminAId,
        email: seed.adminAEmail,
        activeRole: 'ADMIN',
        tenantId: seed.tenantAId,
        nodeId: seed.nodeAId,
        tokenVersion: 0,
    });

    const cookie = `session=${token}; csrf-token=diag-csrf`;
    const mkReq = (url: string) =>
        new NextRequest(new URL(url), {
            method: 'GET',
            headers: { cookie },
        });

    const healthRes = await healthGET();
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, `/api/health failed: status=${healthRes.status} body=${JSON.stringify(healthJson).slice(0, 300)}`);

    const checks = await Promise.all([
        callJson('/api/me', meGET, mkReq('http://localhost:3000/api/me')),
        callJson('/api/dashboard', dashboardGET, mkReq('http://localhost:3000/api/dashboard')),
        callJson('/api/users', usersGET, mkReq('http://localhost:3000/api/users')),
        callJson('/api/courses', coursesGET, mkReq('http://localhost:3000/api/courses')),
        callJson('/api/learning-paths', learningPathsGET, mkReq('http://localhost:3000/api/learning-paths')),
    ]);

    for (const c of checks) {
        assert(c.status === 200, `${c.label} failed: status=${c.status} body=${JSON.stringify(c.json).slice(0, 300)}`);
    }

    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
