import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUser() {
    try {
        // Find admin user
        const admin = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { contains: 'admin' } },
                    { activeRole: 'ADMIN' }
                ]
            },
            select: {
                id: true,
                email: true,
                activeRole: true,
                nodeId: true,
                tenantId: true
            }
        });

        console.log('Admin user found:');
        console.log(admin);

        if (admin) {
            // Check how many users would be visible with this nodeId
            const visibleUsers = await prisma.user.count({
                where: admin.nodeId ? { nodeId: admin.nodeId } : {}
            });
            console.log(`\nUsers visible to this admin (nodeId: ${admin.nodeId}):`, visibleUsers);

            // Check users without nodeId
            const nullNodeUsers = await prisma.user.count({
                where: { nodeId: null }
            });
            console.log('Users with nodeId=null:', nullNodeUsers);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUser();
