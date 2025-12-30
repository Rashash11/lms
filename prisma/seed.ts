import { PrismaClient, RoleKey, UnitType, UnitStatus, CourseStatus, EnrollmentStatus } from '@prisma/client';
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

    // Super Instructor user (has SUPER_INSTRUCTOR and LEARNER roles)
    const superInstructorPassword = await bcrypt.hash('Super123!', 12);
    const superInstructor = await prisma.user.upsert({
        where: { email: 'superinstructor@portal.com' },
        update: { passwordHash: superInstructorPassword },
        create: {
            username: 'superinstructor',
            email: 'superinstructor@portal.com',
            firstName: 'Sarah',
            lastName: 'Super',
            passwordHash: superInstructorPassword,
            status: 'ACTIVE',
            activeRole: 'SUPER_INSTRUCTOR',
        },
    });

    for (const roleKey of ['SUPER_INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { userId_roleKey: { userId: superInstructor.id, roleKey } },
            update: {},
            create: { userId: superInstructor.id, roleKey },
        });
    }
    console.log('✅ Created super instructor user: superinstructor@portal.com / Super123!');

    // Learner users
    const learnerPassword = await bcrypt.hash('Learner123!', 12);
    const learnerDataList = [
        { username: 'learner1', email: 'learner1@portal.com', firstName: 'John', lastName: 'Learner' },
        { username: 'learner2', email: 'learner2@portal.com', firstName: 'Jane', lastName: 'Student' },
        { username: 'learner3', email: 'learner3@portal.com', firstName: 'Bob', lastName: 'Trainee' },
    ];

    const learners = [];
    for (const learnerData of learnerDataList) {
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
        learners.push(learner);
    }
    console.log('✅ Created 3 learner users: learner1/2/3@portal.com / Learner123!');

    // ======= CREATE COURSES =======
    const sampleCourses = [
        { code: 'JS101', title: 'Advanced JavaScript', description: 'Master modern JavaScript features and best practices', status: CourseStatus.PUBLISHED },
        { code: 'REACT101', title: 'React Fundamentals', description: 'Learn React from the ground up', status: CourseStatus.PUBLISHED },
        { code: 'NODE101', title: 'Node.js Backend Development', description: 'Build scalable backend applications with Node.js', status: CourseStatus.PUBLISHED },
        { code: 'PY101', title: 'Python Basics', description: 'Introduction to Python programming', status: CourseStatus.DRAFT },
        { code: 'TS101', title: 'TypeScript Mastery', description: 'Type-safe JavaScript development', status: CourseStatus.PUBLISHED },
    ];

    const createdCourses = [];
    for (const courseData of sampleCourses) {
        const course = await prisma.course.upsert({
            where: { code: courseData.code },
            update: {},
            create: courseData,
        });
        createdCourses.push(course);
    }
    console.log('✅ Created', sampleCourses.length, 'sample courses');

    // ======= ADD CONTENT TO COURSES =======
    for (const course of createdCourses) {
        // Create a section
        const section = await prisma.courseSection.create({
            data: {
                courseId: course.id,
                title: 'Getting Started',
                order_index: 0,
            }
        });

        // Add units to section
        await prisma.courseUnit.createMany({
            data: [
                {
                    courseId: course.id,
                    sectionId: section.id,
                    title: 'Welcome to the Course',
                    type: UnitType.TEXT,
                    order_index: 0,
                    status: UnitStatus.PUBLISHED,
                    config: { content: `<p>Welcome to <strong>${course.title}</strong>! In this course, you will learn everything you need to know about ${course.description}.</p>` },
                },
                {
                    courseId: course.id,
                    sectionId: section.id,
                    title: 'Course Objectives',
                    type: UnitType.TEXT,
                    order_index: 1,
                    status: UnitStatus.PUBLISHED,
                    config: { content: '<ul><li>Understand core concepts</li><li>Build practical projects</li><li>Master advanced techniques</li></ul>' },
                },
                {
                    courseId: course.id,
                    sectionId: section.id,
                    title: 'Introduction Video',
                    type: UnitType.VIDEO,
                    order_index: 2,
                    status: UnitStatus.PUBLISHED,
                    config: {
                        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        provider: 'youtube'
                    },
                }
            ]
        });

        // Add a second section
        const section2 = await prisma.courseSection.create({
            data: {
                courseId: course.id,
                title: 'Core Concepts',
                order_index: 1,
            }
        });

        await prisma.courseUnit.createMany({
            data: [
                {
                    courseId: course.id,
                    sectionId: section2.id,
                    title: 'Lesson 1: The Basics',
                    type: UnitType.TEXT,
                    order_index: 0,
                    status: UnitStatus.PUBLISHED,
                    config: { content: '<p>Laying the foundation for your journey.</p>' },
                }
            ]
        });
    }
    console.log('✅ Added sections and units to all courses');

    // ======= ENROLL LEARNERS =======
    for (const learner of learners) {
        for (const course of createdCourses) {
            if (course.status === CourseStatus.PUBLISHED) {
                await prisma.enrollment.upsert({
                    where: { userId_courseId: { userId: learner.id, courseId: course.id } },
                    update: {},
                    create: {
                        userId: learner.id,
                        courseId: course.id,
                        status: EnrollmentStatus.IN_PROGRESS,
                        progress: 0,
                    }
                });
            }
        }
    }
    console.log('✅ Enrolled learners in all published courses');

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
    const coursesForEvents = await prisma.course.findMany({ take: 3 });
    for (const course of coursesForEvents) {
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

    // ======= CREATE SKILLS =======
    const skills = [
        { name: 'JavaScript', description: 'Modern JavaScript (ES6+), patterns, and performance.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png' },
        { name: 'React', description: 'Component-based UI development with hooks and state management.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1126/1126012.png' },
        { name: 'TypeScript', description: 'Statically typed JavaScript for large-scale applications.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968381.png' },
        { name: 'Node.js', description: 'Server-side runtime for building scalable network applications.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/919/919825.png' },
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
        }
    }
    console.log('✅ Created job roles and linked skills');

    // ======= CREATE LEARNING PATHS =======
    const samplePaths = [
        { name: 'Modern Fullstack Developer', code: 'PATH-FS-01', description: 'Complete path from zero to hero in fullstack JS', status: 'published', isActive: true },
        { name: 'Frontend Excellence', code: 'PATH-FE-01', description: 'Deep dive into React and modern CSS', status: 'published', isActive: true },
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
    console.log('✅ Created learning paths');

    // ======= CREATE STANDALONE ASSIGNMENTS =======
    const sampleAssignments = [
        { title: 'Project Proposal', description: 'Submit your final project proposal for review.', courseId: createdCourses[0].id },
        { title: 'Peer Review', description: 'Review two of your peers projects.', courseId: createdCourses[1].id },
        { title: 'Final Reflection', description: 'What are your key takeaways from this course?', courseId: null },
    ];

    for (const assigData of sampleAssignments) {
        await prisma.assignment.create({
            data: {
                ...assigData,
                createdBy: admin.id,
            }
        });
    }
    console.log('✅ Created sample assignments');

    console.log('');
    console.log('🎉 Database seeded successfully with content and enrollments!');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('   Admin:            admin@portal.com / Admin123!');
    console.log('   Super Instructor: superinstructor@portal.com / Super123!');
    console.log('   Instructor:       instructor@portal.com / Instructor123!');
    console.log('   Learners:         learner1@portal.com / Learner123!');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
