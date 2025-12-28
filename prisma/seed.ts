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
    await prisma.timelineEvent.create({
        data: {
            userId: admin.id,
            courseId: courses[0]?.id,
            eventType: 'COURSE_CREATED',
            details: { title: courses[0]?.title },
        },
    });
    console.log('✅ Created timeline events');

    // ======= CREATE SKILLS =======
    const skills = [
        { name: 'JavaScript', description: 'Modern JavaScript (ES6+), patterns, and performance.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png' },
        { name: 'React', description: 'Component-based UI development with hooks and state management.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1126/1126012.png' },
        { name: 'TypeScript', description: 'Statically typed JavaScript for large-scale applications.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968381.png' },
        { name: 'Node.js', description: 'Server-side runtime for building scalable network applications.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/919/919825.png' },
        { name: 'Agile Mastery', description: 'Scrum, Kanban, and Lean project management methodologies.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2808/2808451.png' },
        { name: 'UI/UX Design', description: 'Principles of user interface and experience design.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1228/1228633.png' },
        { name: 'Cybersecurity', description: 'Protecting systems, networks, and programs from digital attacks.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2569/2569176.png' },
        { name: 'SQL & Databases', description: 'Relational database design and query optimization.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2772/2772128.png' },
    ];

    const seededSkills = [];
    for (const skillData of skills) {
        const skill = await prisma.skill.upsert({
            where: { id: `skill-${skillData.name.toLowerCase().replace(/ /g, '-')}` },
            update: {},
            create: {
                id: `skill-${skillData.name.toLowerCase().replace(/ /g, '-')}`,
                ...skillData
            }
        });
        seededSkills.push(skill);
    }
    console.log('✅ Created', seededSkills.length, 'skills');

    // ======= CREATE JOB ROLES =======
    const roles = [
        { name: 'Frontend Developer', description: 'Builds beautiful and responsive user interfaces.' },
        { name: 'Backend Architect', description: 'Designs and implements scalable server-side systems.' },
        { name: 'Fullstack Engineer', description: 'Masters both frontend and backend technologies.' },
        { name: 'Security Consultant', description: 'Specializes in digital protection and risk assessment.' },
    ];

    for (const roleData of roles) {
        const role = await prisma.jobRole.upsert({
            where: { id: `role-${roleData.name.toLowerCase().replace(/ /g, '-')}` },
            update: {},
            create: {
                id: `role-${roleData.name.toLowerCase().replace(/ /g, '-')}`,
                ...roleData
            }
        });

        // Assign some skills to roles
        if (roleData.name === 'Frontend Developer') {
            await prisma.roleSkill.upsert({
                where: { roleId_skillId: { roleId: role.id, skillId: seededSkills[0].id } },
                update: {},
                create: { roleId: role.id, skillId: seededSkills[0].id, requiredLevel: 'ADVANCED' }
            });
            await prisma.roleSkill.upsert({
                where: { roleId_skillId: { roleId: role.id, skillId: seededSkills[1].id } },
                update: {},
                create: { roleId: role.id, skillId: seededSkills[1].id, requiredLevel: 'ADVANCED' }
            });
        }
    }
    console.log('✅ Created job roles and linked skills');

    // ======= ASSIGN SKILLS TO INSTRUCTOR (Jane Instructor) =======
    // Using the instructor created earlier
    const janeSkills = [
        { skillId: seededSkills[0].id, level: 'ADVANCED' as const, progress: 95 },
        { skillId: seededSkills[1].id, level: 'INTERMEDIATE' as const, progress: 70 },
        { skillId: seededSkills[2].id, level: 'ADVANCED' as const, progress: 85 },
    ];

    for (const skillItem of janeSkills) {
        await prisma.userSkill.upsert({
            where: { userId_skillId: { userId: instructor.id, skillId: skillItem.skillId } },
            update: { level: skillItem.level, progress: skillItem.progress },
            create: { userId: instructor.id, ...skillItem }
        });
    }
    console.log('✅ Assigned skills to instructor');

    // ======= CREATE LEARNING PATHS =======
    const samplePaths = [
        { name: 'Modern Fullstack Developer', code: 'PATH-FS-01', description: 'Complete path from zero to hero in fullstack JS', status: 'published', isActive: true },
        { name: 'Frontend Excellence', code: 'PATH-FE-01', description: 'Deep dive into React and modern CSS', status: 'published', isActive: true },
        { name: 'Backend Mastery', code: 'PATH-BE-01', description: 'Master Node.js, SQL and System Design', status: 'inactive', isActive: false },
    ];

    for (const pathData of samplePaths) {
        await prisma.learningPath.upsert({
            where: { code: pathData.code },
            update: {},
            create: {
                ...pathData,
                instructorId: instructor.id,
            }
        });
    }
    console.log('✅ Created', samplePaths.length, 'sample learning paths');

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
