
import { getUnscopedPrisma } from '@/lib/prisma';

const prisma = getUnscopedPrisma();

async function main() {
    console.log('DB URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');
    const user = await prisma.user.findFirst({
        where: { email: 'admin@portal.com' },
        // include: { roles: true }
    });
    console.log('User found:', user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
