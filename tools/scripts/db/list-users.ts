import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                activeRole: true,
                isActive: true
            }
        });
        console.log('--- USERS IN DATABASE ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('-------------------------');
    } catch (err) {
        console.error('Error fetching users:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
