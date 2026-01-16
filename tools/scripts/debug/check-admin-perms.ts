import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminPerms() {
    console.log('Checking ADMIN permissions...');
    
    const adminRole = await prisma.authRole.findFirst({
        where: { name: 'ADMIN' },
        include: { rolePermissions: { include: { permission: true } } }
    });

    if (!adminRole) {
        console.error('ADMIN role not found!');
        return;
    }

    console.log(`Role: ${adminRole.name}`);
    console.log(`Total Permissions: ${adminRole.rolePermissions.length}`);

    const hasUserRead = adminRole.rolePermissions.some(p => p.permission.name === 'user:read' || p.permission.name === '*');
    
    if (hasUserRead) {
        console.log('✅ ADMIN has user:read permission');
    } else {
        console.log('❌ ADMIN matches NO user:read permission');
    }

    // List all permissions
    const perms = adminRole.rolePermissions.map(p => p.permission.name).sort();
    console.log('Permissions:', perms);
}

checkAdminPerms()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
