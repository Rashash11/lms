import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from '../apps/web/src/server/permissions-registry';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

function assert(condition: unknown, message: string) {
    if (!condition) throw new Error(message);
}

async function main() {
    const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
    const prisma = new PrismaClient({
        datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    });

    try {
        const [roles, perms, mappings] = await Promise.all([
            prisma.authRole.count(),
            prisma.authPermission.count(),
            prisma.authRolePermission.count(),
        ]);

        assert(roles >= 4, `RBAC roles too low: ${roles}`);
        assert(perms >= ALL_PERMISSIONS.length, `RBAC permissions too low: ${perms} < ${ALL_PERMISSIONS.length}`);
        assert(mappings > 0, 'RBAC role-permission mappings missing');

        process.stdout.write('OK\n');
    } finally {
        await prisma.$disconnect().catch(() => undefined);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
