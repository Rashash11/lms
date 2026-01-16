import { PrismaClient } from '@prisma/client';
import { can } from '@/lib/permissions';

async function debugPermission() {
    const prisma = new PrismaClient();
    const learner = await prisma.user.findFirst({
        where: { email: 'learner1@portal.com' },
        include: { roles: true }
    });

    if (!learner) {
        console.log('Learner not found');
        return;
    }

    console.log('Learner data:', JSON.stringify({
        id: learner.id,
        email: learner.email,
        role: learner.activeRole,
        roles: learner.roles
    }, null, 2));

    const session = {
        userId: learner.id,
        email: learner.email,
        activeRole: learner.activeRole,
        role: learner.activeRole,
        tenantId: learner.tenantId,
    };

    const hasCourseCreate = await can(session, 'course:create');
    console.log(`Has course:create? ${hasCourseCreate}`);

    const hasCourseRead = await can(session, 'course:read');
    console.log(`Has course:read? ${hasCourseRead}`);
}

debugPermission().catch(console.error);
