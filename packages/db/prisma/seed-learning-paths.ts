import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLearningPaths() {
    console.log('Seeding learning paths...');
    const preferredTenantId =
        process.env.TENANT_ID ||
        process.env.DEFAULT_TENANT_ID ||
        process.env.SEED_TENANT_ID ||
        'default-tenant-id';
    const tenant =
        (await prisma.tenant.findUnique({ where: { id: preferredTenantId } })) ||
        (await prisma.tenant.findFirst());
    if (!tenant) throw new Error('No tenant found. Create a tenant before seeding learning paths.');

    // Create sample learning path
    const newPath = await prisma.learningPath.create({
        data: {
            tenantId: tenant.id,
            name: 'New learning path',
            status: 'inactive',
        },
    });

    console.log('Created learning path:', newPath.name);

    // You can add more paths here
    const paths = await prisma.learningPath.createMany({
        data: [
            {
                tenantId: tenant.id,
                name: 'Frontend Developer Path',
                code: 'FE-DEV-2024',
                category: 'Web Development',
                status: 'published',
                description: 'Complete path for becoming a frontend developer',
            },
            {
                tenantId: tenant.id,
                name: 'Data Science Basics',
                code: 'DS-101',
                category: 'Data & Analytics',
                status: 'published',
                description: 'Introduction to data science and analytics',
            },
            {
                tenantId: tenant.id,
                name: 'DevOps Foundation',
                code: 'DEVOPS-001',
                category: 'Infrastructure',
                status: 'draft',
                description: 'Learn the fundamentals of DevOps practices',
            },
        ],
    });

    console.log(`Created ${paths.count} additional learning paths`);
    console.log('Seed completed!');
}

seedLearningPaths()
    .catch((e) => {
        console.error('Error seeding learning paths:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
