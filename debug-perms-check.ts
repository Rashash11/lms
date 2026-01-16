
import { PrismaClient } from '@prisma/client';
import { getUserPermissions } from './src/lib/permissions';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@lms.com'; // Adjust if needed
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
        console.log(`User ${email} not found`);
        return;
    }

    console.log(`Checking permissions for user: ${user.email} (ID: ${user.id})`);
    console.log(`Role: ${user.activeRole}`);

    // Check raw DB entries
    const dbRoles = await prisma.authRole.findMany();
    console.log('DB Roles:', dbRoles.map(r => r.name));

    const dbPermissions = await prisma.authPermission.findMany();
    console.log('DB Permissions count:', dbPermissions.length);

    // Check getUserPermissions output
    try {
        const permissions = await getUserPermissions(user.id, user.nodeId || undefined);
        console.log('getUserPermissions result:', permissions);
        console.log('Has roles:read?', permissions.includes('roles:read'));
        console.log('Has organization:read?', permissions.includes('organization:read'));
    } catch (e) {
        console.error('Error getting permissions:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
