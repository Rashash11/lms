import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { signAccessToken, verifyAccessTokenLight } from '../apps/web/src/server/auth-definitions';

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
        userId: seed.adminAId,
        email: seed.adminAEmail,
        activeRole: 'ADMIN',
        tenantId: seed.tenantAId,
        nodeId: seed.nodeAId,
        tokenVersion: 0,
    });

    const claims = await verifyAccessTokenLight(token);
    assert(claims.userId === seed.adminAId, 'Token userId mismatch');
    assert(claims.tenantId === seed.tenantAId, 'Token tenantId mismatch');
    assert(claims.activeRole === 'ADMIN', 'Token role mismatch');

    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
