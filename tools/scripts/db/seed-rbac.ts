import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { ALL_PERMISSIONS } from '../../../apps/web/src/server/permissions-registry';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
const prisma = new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
    ADMIN: ALL_PERMISSIONS,
    SUPER_INSTRUCTOR: [
        'course:read', 'course:create', 'course:update', 'course:update_any', 'course:publish', 'course:delete',
        'unit:read', 'unit:create', 'unit:update', 'unit:update_any', 'unit:publish', 'unit:delete',
        'learning_path:read', 'learning_path:create', 'learning_path:update', 'learning_path:delete',
        'group:read', 'group:create', 'group:update', 'group:delete',
        'user:read', 'user:create', 'user:update', 'user:delete',
        'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
        'submission:read', 'submission:grade', 'submission:publish', 'submission:download',
        'reports:read', 'reports:export',
        'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
        'conference:read', 'conference:create', 'conference:update', 'conference:delete',
        'skills:read', 'skills:update', 'skills:create', 'skills:delete',
        'certificate:template:read', 'certificate:template:create', 'certificate:template:update', 'certificate:template:delete',
        'certificate:issue:read'
    ],
    INSTRUCTOR: [
        'course:read', 'course:create', 'course:update', 'course:publish',
        'unit:read', 'unit:create', 'unit:update', 'unit:publish', 'unit:delete',
        'learning_path:read', 'learning_path:create', 'learning_path:update',
        'group:read', 'group:create', 'group:update', 'group:delete',
        'user:read',
        'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
        'submission:read', 'submission:grade', 'submission:publish', 'submission:download',
        'reports:read',
        'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
        'conference:read', 'conference:create', 'conference:update', 'conference:delete',
        'skills:read',
        'certificate:template:read', 'certificate:issue:read'
    ],
    LEARNER: [
        'course:read',
        'unit:read',
        'learning_path:read',
        'assignment:read',
        'submission:read', 'submission:create',
        'calendar:read',
        'skills:read',
        'certificate:view_own'
    ]
};

async function seedRBAC() {
    console.log('🌱 Seeding RBAC tables...\n');

    // Step 1: Upsert roles
    console.log('Step 1: Upserting roles...');
    for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
        await prisma.authRole.upsert({
            where: { name: roleName },
            create: {
                id: crypto.randomUUID(),
                name: roleName,
                description: `${roleName} role`,
            },
            update: {},
        });
        console.log(`✅ Role: ${roleName}`);
    }

    // Step 2: Upsert permissions
    console.log('\nStep 2: Upserting permissions...');
    for (const perm of ALL_PERMISSIONS) {
        await prisma.authPermission.upsert({
            where: { fullPermission: perm },
            create: {
                id: crypto.randomUUID(),
                name: perm,
                fullPermission: perm,
            },
            update: {},
        });
    }
    console.log(`✅ Created/updated ${ALL_PERMISSIONS.length} permissions`);

    // Step 3: Upsert role-permission mappings
    console.log('\nStep 3: Upserting role-permission mappings...');
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
        const role = await prisma.authRole.findUnique({ where: { name: roleName } });
        if (!role) continue;

        // Delete existing mappings for clean slate
        await prisma.authRolePermission.deleteMany({ where: { roleId: role.id } });

        // Create new mappings
        for (const permName of permissions) {
            const permission = await prisma.authPermission.findUnique({ where: { fullPermission: permName } });
            if (!permission) {
                console.warn(`⚠️  Permission not found: ${permName}`);
                continue;
            }

            await prisma.authRolePermission.create({
                data: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            });
        }
        console.log(`✅ ${roleName}: ${permissions.length} permissions`);
    }

    console.log('\n✅ RBAC seeding completed successfully!');
}

seedRBAC()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
