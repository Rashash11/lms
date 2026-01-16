import { PrismaClient } from '@prisma/client';

async function checkDb() {
    const prisma = new PrismaClient();
    const learnerRole = await (prisma as any).authRole.findFirst({
        where: { name: 'LEARNER' },
        include: {
            rolePermissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    console.log('LEARNER permissions from DB:');
    learnerRole?.rolePermissions.forEach(p => {
        console.log(` - ${p.permission.fullPermission}`);
    });

    const learnerUser = await prisma.user.findFirst({
        where: { email: 'learner1@portal.com' },
        include: {
            roles: true
        }
    });

    console.log('\nLearner User:');
    console.log(` - ID: ${learnerUser?.id}`);
    console.log(` - Role column: ${(learnerUser as any).role}`);
    console.log(` - Overrides: ${JSON.stringify((learnerUser as any).rbacOverrides)}`);
    console.log(` - Roles relation: ${learnerUser?.roles.map(r => r.roleKey).join(', ')}`);

    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@portal.com' } });
    console.log(`\nAdmin ID: ${adminUser?.id}`);
}

checkDb().catch(console.error);
