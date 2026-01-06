const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMostafa() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firstName: { contains: 'mostafa', mode: 'insensitive' } },
                { lastName: { contains: 'mostafa', mode: 'insensitive' } },
                { email: { contains: 'mostafa', mode: 'insensitive' } },
                { username: { contains: 'mostafa', mode: 'insensitive' } }
            ]
        },
        include: { roles: true }
    });

    console.log('Found users:', JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

findMostafa();
