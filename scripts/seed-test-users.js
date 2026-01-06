const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestUsers() {
    console.log('🌱 Seeding test users...\n');

    const users = [
        {
            email: 'admin@portal.com',
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            password: 'Admin123!',
            role: 'ADMIN',
        },
        {
            email: 'instructor@portal.com',
            username: 'instructor',
            firstName: 'Instructor',
            lastName: 'User',
            password: 'Instructor123!',
            role: 'INSTRUCTOR',
        },
        {
            email: 'super.instructor@portal.com',
            username: 'superinstructor',
            firstName: 'Super',
            lastName: 'Instructor',
            password: 'SuperInstructor123!',
            role: 'SUPER_INSTRUCTOR',
        },
        {
            email: 'learner1@portal.com',
            username: 'learner1',
            firstName: 'Learner',
            lastName: 'One',
            password: 'Learner123!',
            role: 'LEARNER',
        },
        {
            email: 'learner2@portal.com',
            username: 'learner2',
            firstName: 'Learner',
            lastName: 'Two',
            password: 'Learner123!',
            role: 'LEARNER',
        },
    ];

    for (const userData of users) {
        const passwordHash = await bcrypt.hash(userData.password, 10);

        const user = await prisma.user.upsert({
            where: { email: userData.email },
            create: {
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                passwordHash: passwordHash,
                role: userData.role,
                isActive: true,
                isVerified: true,
            },
            update: {
                passwordHash: passwordHash,
                role: userData.role,
                isActive: true,
                isVerified: true,
            },
        });
        console.log(`✅ ${userData.role} user: ${user.email} (ID: ${user.id})`);
    }

    console.log('\n✅ Test users seeded successfully!');
}

seedTestUsers()
    .catch(e => console.error('❌ Seeding failed:', e))
    .finally(() => prisma.$disconnect());
