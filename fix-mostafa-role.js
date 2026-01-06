// Quick fix for mostafa's activeRole
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMostafaRole() {
    try {
        // Find mostafa
        const mostafa = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: 'mostafa' },
                    { email: { contains: 'mostafa' } }
                ]
            },
            include: { roles: true }
        });

        if (!mostafa) {
            console.log('❌ User mostafa not found');
            return;
        }

        console.log(`Found user: ${mostafa.firstName} ${mostafa.lastName} (${mostafa.email})`);
        console.log(`Current activeRole: ${mostafa.role}`);
        console.log(`Assigned roles:`, mostafa.roles.map(r => r.roleKey));

        // If user has ADMIN role assigned, set activeRole to ADMIN
        const hasAdminRole = mostafa.roles.some(r => r.roleKey === 'ADMIN');

        if (hasAdminRole && mostafa.role !== 'ADMIN') {
            await prisma.user.update({
                where: { id: mostafa.id },
                data: { role: 'ADMIN' }
            });
            console.log('✅ Updated activeRole to ADMIN');
        } else if (mostafa.role === 'ADMIN') {
            console.log('✅ activeRole is already set to ADMIN');
        } else {
            console.log('⚠️  User does not have ADMIN role assigned. Assigned roles:', mostafa.roles.map(r => r.roleKey));
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixMostafaRole();
