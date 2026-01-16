import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { NextRequest } from 'next/server';
import { signAccessToken } from '../apps/web/src/server/auth-definitions';
import { GET as healthGET } from '../apps/web/src/app/api/health/route';
import { GET as meGET } from '../apps/web/src/app/api/me/route';

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

async function callMe(seed: any, roleKey: string, includeTenantInJwt: boolean) {
    const roleMap: Record<string, { id: string; email: string }> = {
        ADMIN: { id: seed.adminAId, email: seed.adminAEmail },
        SUPER_INSTRUCTOR: { id: seed.superInstructorAId, email: seed.superInstructorAEmail },
        INSTRUCTOR: { id: seed.instructorAId, email: seed.instructorAEmail },
        LEARNER: { id: seed.learnerAId, email: seed.learnerAEmail },
    };

    const user = roleMap[roleKey];
    assert(user?.id && user?.email, `Missing fixture user for role ${roleKey}`);

    const token = await signAccessToken({
        userId: user.id,
        email: user.email,
        activeRole: roleKey as any,
        tenantId: includeTenantInJwt ? seed.tenantAId : undefined,
        nodeId: seed.nodeAId,
        tokenVersion: 0,
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/me'), {
        method: 'GET',
        headers: {
            cookie: `session=${token}; csrf-token=smoke-csrf`,
        },
    });

    const res = await meGET(req);
    const body = await res.json().catch(() => ({}));
    assert(res.status === 200, `/api/me failed for ${roleKey} (tenantInJwt=${includeTenantInJwt}) status=${res.status} body=${JSON.stringify(body).slice(0, 300)}`);
    assert(body?.ok === true, `/api/me ok=false for ${roleKey}`);
    assert(body?.user?.id === user.id, `/api/me user mismatch for ${roleKey}`);
    assert(typeof body?.claims?.tenantId === 'string' && body.claims.tenantId.length > 0, `/api/me missing tenantId for ${roleKey}`);
}

async function main() {
    const seed = readSeed();

    const healthRes = await healthGET();
    const health = await healthRes.json();
    assert(healthRes.status === 200, `/api/health not healthy: status=${healthRes.status} body=${JSON.stringify(health).slice(0, 300)}`);

    await callMe(seed, 'ADMIN', true);
    await callMe(seed, 'SUPER_INSTRUCTOR', true);
    await callMe(seed, 'INSTRUCTOR', true);
    await callMe(seed, 'LEARNER', true);

    await callMe(seed, 'ADMIN', false);
    await callMe(seed, 'INSTRUCTOR', false);
    await callMe(seed, 'LEARNER', false);

    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
