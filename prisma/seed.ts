import { PrismaClient, RoleKey } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default tenant
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
    console.log('✅ Created tenant:', tenant.name);

    // Create default branch
    const branch = await prisma.branch.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: 'main' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Main Branch',
            slug: 'main',
            title: 'Main Training Portal',
            description: 'The main training portal for all employees',
            settings: {},
        },
    });
    console.log('✅ Created branch:', branch.name);

    // ======= CREATE USERS WITH ROLES =======

    // Admin user (has all roles)
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@portal.com' },
        update: { passwordHash: adminPassword },
        create: {
            username: 'admin',
            email: 'admin@portal.com',
            firstName: 'System',
            lastName: 'Administrator',
            passwordHash: adminPassword,
            status: 'ACTIVE',
            activeRole: 'ADMIN',
        },
    });

    // Assign all roles to admin
    for (const roleKey of ['ADMIN', 'INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { userId_roleKey: { userId: admin.id, roleKey } },
            update: {},
            create: { userId: admin.id, roleKey },
        });
    }
    console.log('✅ Created admin user: admin@portal.com / Admin123!');

    // Instructor user (has INSTRUCTOR and LEARNER roles)
    const instructorPassword = await bcrypt.hash('Instructor123!', 12);
    const instructor = await prisma.user.upsert({
        where: { email: 'instructor@portal.com' },
        update: { passwordHash: instructorPassword },
        create: {
            username: 'instructor',
            email: 'instructor@portal.com',
            firstName: 'Jane',
            lastName: 'Instructor',
            passwordHash: instructorPassword,
            status: 'ACTIVE',
            activeRole: 'INSTRUCTOR',
        },
    });

    for (const roleKey of ['INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { userId_roleKey: { userId: instructor.id, roleKey } },
            update: {},
            create: { userId: instructor.id, roleKey },
        });
    }
    console.log('✅ Created instructor user: instructor@portal.com / Instructor123!');

    // Learner users
    const learnerPassword = await bcrypt.hash('Learner123!', 12);
    const learners = [
        { username: 'learner1', email: 'learner1@portal.com', firstName: 'John', lastName: 'Learner' },
        { username: 'learner2', email: 'learner2@portal.com', firstName: 'Jane', lastName: 'Student' },
        { username: 'learner3', email: 'learner3@portal.com', firstName: 'Bob', lastName: 'Trainee' },
    ];

    for (const learnerData of learners) {
        const learner = await prisma.user.upsert({
            where: { email: learnerData.email },
            update: { passwordHash: learnerPassword },
            create: {
                ...learnerData,
                passwordHash: learnerPassword,
                status: 'ACTIVE',
                activeRole: 'LEARNER',
            },
        });

        await prisma.userRole.upsert({
            where: { userId_roleKey: { userId: learner.id, roleKey: 'LEARNER' } },
            update: {},
            create: { userId: learner.id, roleKey: 'LEARNER' },
        });
    }
    console.log('✅ Created 3 learner users: learner1/2/3@portal.com / Learner123!');

    // ======= CREATE COURSES =======
    const sampleCourses = [
        { code: 'JS101', title: 'Advanced JavaScript', description: 'Master modern JavaScript features and best practices', status: 'PUBLISHED' as const },
        { code: 'REACT101', title: 'React Fundamentals', description: 'Learn React from the ground up', status: 'PUBLISHED' as const },
        { code: 'NODE101', title: 'Node.js Backend Development', description: 'Build scalable backend applications with Node.js', status: 'PUBLISHED' as const },
        { code: 'PY101', title: 'Python Basics', description: 'Introduction to Python programming', status: 'DRAFT' as const },
        { code: 'TS101', title: 'TypeScript Mastery', description: 'Type-safe JavaScript development', status: 'PUBLISHED' as const },
        { code: 'SQL101', title: 'SQL Fundamentals', description: 'Database design and querying', status: 'DRAFT' as const },
        { code: 'SEC101', title: 'Cybersecurity Basics', description: 'Essential security practices', status: 'PUBLISHED' as const },
        { code: 'AGILE101', title: 'Agile Project Management', description: 'Scrum and Kanban methodologies', status: 'PUBLISHED' as const },
        { code: 'LEAD101', title: 'Leadership Skills', description: 'Develop your leadership potential', status: 'PUBLISHED' as const },
        { code: 'COMM101', title: 'Effective Communication', description: 'Master professional communication', status: 'PUBLISHED' as const },
    ];

    for (const courseData of sampleCourses) {
        await prisma.course.upsert({
            where: { code: courseData.code },
            update: {},
            create: courseData,
        });
    }
    console.log('✅ Created', sampleCourses.length, 'sample courses');

    // ======= CREATE CATEGORIES =======
    const rootCategory = await prisma.category.create({
        data: { name: 'All Courses', description: 'Root category' },
    }).catch(() => null);

    const categories = [
        { name: 'Development', description: 'Programming and software development courses' },
        { name: 'Design', description: 'UI/UX and graphic design courses' },
        { name: 'Management', description: 'Leadership and management training' },
        { name: 'Compliance', description: 'Regulatory and compliance training' },
        { name: 'Soft Skills', description: 'Communication and interpersonal skills' },
    ];

    for (const catData of categories) {
        await prisma.category.create({
            data: { ...catData, parentId: rootCategory?.id },
        }).catch(() => { });
    }
    console.log('✅ Created sample categories');

    // ======= CREATE TIMELINE EVENTS =======
    await prisma.timelineEvent.create({
        data: {
            userId: admin.id,
            eventType: 'USER_LOGIN',
            details: { email: admin.email },
        },
    });

    await prisma.timelineEvent.create({
        data: {
            userId: instructor.id,
            eventType: 'USER_LOGIN',
            details: { email: instructor.email },
        },
    });

    const courses = await prisma.course.findMany({ take: 3 });
    for (const course of courses) {
        await prisma.timelineEvent.create({
            data: {
                userId: admin.id,
                courseId: course.id,
                eventType: 'COURSE_CREATED',
                details: { title: course.title },
            },
        });
    }
    console.log('✅ Created timeline events');

    console.log('');
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('   Admin:      admin@portal.com / Admin123!');
    console.log('   Instructor: instructor@portal.com / Instructor123!');
    console.log('   Learners:   learner1@portal.com / Learner123!');
    console.log('');
    console.log('💡 Admin has all roles, Instructor has Instructor+Learner, Learners have Learner only.');
    console.log('   Use role switching in the user menu to switch between roles.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
