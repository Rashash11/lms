import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from '../apps/web/src/server/permissions-registry';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

function assert(condition: unknown, message: string) {
    if (!condition) throw new Error(message);
}

const REQUIRED: Record<string, string[]> = {
    ADMIN: ['user:create', 'course:create', 'learning_path:create', 'group:create', 'reports:read'],
    SUPER_INSTRUCTOR: ['course:create', 'learning_path:create', 'group:create', 'reports:read'],
    INSTRUCTOR: ['course:create', 'learning_path:create', 'group:create', 'reports:read'],
    LEARNER: ['course:read', 'unit:read', 'learning_path:read'],
};

async function main() {
    const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
    const prisma = new PrismaClient({
        datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    });

    try {
        for (const [roleName, requiredPerms] of Object.entries(REQUIRED)) {
            const role = await prisma.authRole.findUnique({
                where: { name: roleName },
                include: { rolePermissions: { include: { permission: true } } },
            });
            assert(role, `Missing role ${roleName}`);
            const perms = new Set(role!.rolePermissions.map((rp) => rp.permission.fullPermission));
            for (const p of requiredPerms) {
                assert(perms.has(p), `Role ${roleName} missing permission ${p}`);
            }
            assert(perms.size > 0, `Role ${roleName} has no permissions`);
            if (roleName === 'ADMIN') {
                assert(perms.size >= ALL_PERMISSIONS.length, `ADMIN permissions incomplete: ${perms.size} < ${ALL_PERMISSIONS.length}`);
            }
        }

        process.stdout.write('OK\n');
    } finally {
        await prisma.$disconnect().catch(() => undefined);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
