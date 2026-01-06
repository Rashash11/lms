const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debug() {
    // 1. Check if admin user exists
    const user = await prisma.user.findUnique({
        where: { email: 'admin@portal.com' }
    });

    if (!user) {
        console.log('❌ User admin@portal.com not found!');
        return;
    }

    console.log('✅ User found');
    console.log('User ID:', user.id);
    console.log('Role (activeRole column):', user.role);
    console.log('isActive:', user.isActive);
    console.log('isVerified:', user.isVerified);
    console.log('passwordHash exists:', !!user.passwordHash);
    console.log('passwordHash prefix:', user.passwordHash?.substring(0, 10));

    // 2. Test password comparison
    const testPassword = 'Admin123!';
    if (user.passwordHash) {
        const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`\nPassword "${testPassword}" matches:`, isMatch);
    } else {
        console.log('\n❌ No password hash set for this user!');
    }

    // 3. Check auth_role table has ADMIN role
    const adminRole = await prisma.$queryRaw`SELECT * FROM auth_role WHERE name = 'ADMIN'`;
    console.log('\nADMIN role in auth_role table:', adminRole);

    // 4. Check permissions for ADMIN role
    const perms = await prisma.$queryRaw`
        SELECT ap."fullPermission" 
        FROM auth_role_permission arp 
        JOIN auth_role ar ON ar.id = arp."roleId"
        JOIN auth_permission ap ON ap.id = arp."permissionId"
        WHERE ar.name = 'ADMIN'
        LIMIT 5
    `;
    console.log('\nFirst 5 ADMIN permissions:', perms);
}

debug()
    .catch(e => console.error('Debug failed:', e))
    .finally(() => prisma.$disconnect());
