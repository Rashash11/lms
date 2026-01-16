import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const roles = await prisma.authRole.findMany();
        console.log('Roles in DB:');
        console.log(JSON.stringify(roles, null, 2));
    } catch (error) {
        console.error('Error fetching roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
