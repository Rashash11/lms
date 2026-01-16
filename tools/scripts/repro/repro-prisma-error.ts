import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Reproducing Prisma error...');
    try {
        const tenant = await prisma.tenant.upsert({
            where: { domain: 'default.talentlms.local' },
            update: {},
            create: {
                domain: 'default.talentlms.local',
                name: 'Default Portal',
                settings: {
                    theme: 'default',
                    language: 'en',
                },
            },
        });
        console.log('Success:', tenant);
    } catch (error: any) {
        const fs = require('fs');
        console.error('CAUGHT ERROR:');
        fs.writeFileSync('prisma_error_full.txt', error.message + '\n' + error.stack);
        console.error(error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();
