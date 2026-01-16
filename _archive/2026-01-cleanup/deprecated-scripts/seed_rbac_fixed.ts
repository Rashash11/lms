import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const roles = ['ADMIN', 'SUPER_INSTRUCTOR', 'INSTRUCTOR', 'LEARNER'];

    console.log('Seeding roles...');
    for (const name of roles) {
        const r = await prisma.authRole.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        console.log(`Role: ${r.name} ID: ${r.id}`);
    }

    const perms = ['course:create', 'course:read', 'course:update', 'course:delete', 'user:create', 'user:read', 'user:update', 'user:delete', 'user:assign_role'];
    console.log('Seeding permissions...');
    const permMap: Record<string, string> = {};
    for (const name of perms) {
        const p = await prisma.authPermission.upsert({
            where: { name },
            update: {},
            create: { name, fullPermission: name }
        });
        permMap[name] = p.id;
        console.log(`Perm: ${p.name} ID: ${p.id}`);
    }

    console.log('Mapping permissions to roles...');
    const adminRole = await prisma.authRole.findUnique({ where: { name: 'ADMIN' } });
    if (adminRole) {
        for (const pid of Object.values(permMap)) {
            await (prisma as any).authRolePermission.upsert({
                where: { roleId_permissionId: { roleId: adminRole.id, permissionId: pid } },
                update: {},
                create: { roleId: adminRole.id, permissionId: pid }
            });
        }
    }

    const instructorRole = await prisma.authRole.findUnique({ where: { name: 'INSTRUCTOR' } });
    if (instructorRole) {
        const instructorPerms = ['course:create', 'course:read', 'course:update'];
        for (const name of instructorPerms) {
            await (prisma as any).authRolePermission.upsert({
                where: { roleId_permissionId: { roleId: instructorRole.id, permissionId: permMap[name] } },
                update: {},
                create: { roleId: instructorRole.id, permissionId: permMap[name] }
            });
        }
    }

    await prisma.$disconnect();
}

main().catch(console.error);
