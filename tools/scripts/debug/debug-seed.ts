
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

console.log('Debug script starting...');
console.log('DB URL:', process.env.DATABASE_URL_TEST || process.env.DATABASE_URL);

try {
    const prisma = new PrismaClient({
        datasources: {
            db: { url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL },
        },
    });
    console.log('Prisma initialized.');

    prisma.$connect().then(async () => {
        console.log('Connected.');
        const tenants = await prisma.tenant.findMany();
        console.log('Tenants:', tenants);
        await prisma.$disconnect();
    }).catch(e => {
        console.error('Connection failed:', e);
    });

} catch (e) {
    console.error('Init failed:', e);
}
