import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { NextRequest } from 'next/server';
import { signAccessToken } from '../apps/web/src/server/auth-definitions';
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

async function main() {
    const seed = readSeed();
    const token = await signAccessToken({
        userId: seed.learnerAId,
        email: seed.learnerAEmail,
        activeRole: 'LEARNER',
        tenantId: seed.tenantAId,
        nodeId: seed.nodeAId,
        tokenVersion: 0,
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/me'), {
        method: 'GET',
        headers: { cookie: `session=${token}; csrf-token=learner-csrf` },
    });

    const res = await meGET(req);
    const body = await res.json().catch(() => ({}));
    assert(res.status === 200, `learner /api/me failed status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`);
    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
