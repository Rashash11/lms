import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        const userCount = await prisma.user.count();
        console.log('Total users in database:', userCount);

        if (userCount > 0) {
            const users = await prisma.user.findMany({
                take: 5,
                select: {
                    id: true,
                    email: true,
                    activeRole: true,
                    nodeId: true,
                    tenantId: true
                }
            });
            console.log('\nSample users:');
            console.table(users);
        }

        const tenantCount = await prisma.tenant.count();
        console.log('\nTotal tenants:', tenantCount);

        const branchCount = await prisma.branch.count();
        console.log('Total branches:', branchCount);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
