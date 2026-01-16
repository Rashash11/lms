/**
 * Test Seed Script
 * 
 * Seeds deterministic fixtures for E2E testing.
 * Exports fixture IDs to tests/e2e/fixtures/seed.json
 * 
 * Usage: npx tsx scripts/test-seed.ts
 */

import { PrismaClient, RoleKey, CourseStatus, UnitType, UnitStatus, EnrollmentStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
// dotenv imported above

// Load environment variables
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

const TEST_DB_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

const prisma = new PrismaClient({
    datasources: {
        db: { url: TEST_DB_URL },
    },
});

const TEST_PASSWORD = 'TestPass123!';

interface SeedFixtures {
    // Tenants
    tenantAId: string;
    tenantBId: string;
    // Branches (nodes)
    nodeAId: string;
    nodeBId: string;
    nodeCId: string;
    // Users
    adminAId: string;
    adminAEmail: string;
    superInstructorAId: string;
    superInstructorAEmail: string;
    instructorAId: string;
    instructorAEmail: string;
    instructorBId: string;
    instructorBEmail: string;
    learnerAId: string;
    learnerAEmail: string;
    learnerBId: string;
    learnerBEmail: string;
    adminBId: string;
    adminBEmail: string;
    // Content
    categoryAId: string;
    groupAId: string;
    courseAId: string;
    courseBId: string;
    sectionAId: string;
    unitVideoId: string;
    unitDocumentId: string;
    unitQuizId: string;
    lpAId: string;
    enrollmentAId: string;
    enrollmentBId: string;
    lpEnrollmentAId: string;
    assignmentAId: string;
    submissionAId: string;
    skillAId: string;
    conferenceAId: string;
    calendarEventAId: string;
    notificationAId: string;
    automationAId: string;
    // Password for all test users
    testPassword: string;
}

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

async function seed(): Promise<SeedFixtures> {
    console.log('🌱 Seeding test database...\n');

    const passwordHash = await hashPassword(TEST_PASSWORD);

    // ============================================
    // RBAC SEEDING
    // ============================================
    console.log('🛡️ Seeding RBAC...');
    try {
        const { execSync } = require('child_process');
        execSync('npx tsx scripts/seed-rbac.ts', { stdio: 'inherit' });
    } catch (e) {
        console.warn('⚠️ Failed to seed RBAC from test-seed.ts. Ensure scripts/seed-rbac.ts exists and works.');
    }

    // ============================================
    // TENANTS
    // ============================================
    console.log('📦 Creating tenants...');

    const tenantA = await prisma.tenant.upsert({
        where: { domain: 'test-tenant-a.local' },
        update: {},
        create: {
            domain: 'test-tenant-a.local',
            name: 'Test Tenant A',
            settings: {},
        },
    });

    const tenantB = await prisma.tenant.upsert({
        where: { domain: 'test-tenant-b.local' },
        update: {},
        create: {
            domain: 'test-tenant-b.local',
            name: 'Test Tenant B',
            settings: {},
        },
    });

    // ============================================
    // BRANCHES (NODES)
    // ============================================
    console.log('🏢 Creating branches (nodes)...');

    // Check if branches exist first
    let nodeA = await prisma.branch.findFirst({ where: { slug: 'node-a', tenantId: tenantA.id } });
    if (!nodeA) {
        nodeA = await prisma.branch.create({
            data: {
                tenantId: tenantA.id,
                name: 'Node A',
                slug: 'node-a',
                title: 'Test Branch A',
                description: 'Primary test branch for tenant A',
                isActive: true,
            },
        });
    }

    let nodeB = await prisma.branch.findFirst({ where: { slug: 'node-b', tenantId: tenantA.id } });
    if (!nodeB) {
        nodeB = await prisma.branch.create({
            data: {
                tenantId: tenantA.id,
                name: 'Node B',
                slug: 'node-b',
                title: 'Test Branch B',
                description: 'Secondary test branch for tenant A',
                isActive: true,
            },
        });
    }

    let nodeC = await prisma.branch.findFirst({ where: { slug: 'node-c', tenantId: tenantB.id } });
    if (!nodeC) {
        nodeC = await prisma.branch.create({
            data: {
                tenantId: tenantB.id,
                name: 'Node C',
                slug: 'node-c',
                title: 'Test Branch C',
                description: 'Primary test branch for tenant B',
                isActive: true,
            },
        });
    }

    // ============================================
    // USERS
    // ============================================
    console.log('👥 Creating users...');

    // Admin A (Tenant A, global)
    const adminA = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenantA.id, email: 'admin-a@test.local' } },
        update: { passwordHash, activeRole: RoleKey.ADMIN },
        create: {
            username: 'admin_a',
            email: 'admin-a@test.local',
            firstName: 'Admin',
            lastName: 'TenantA',
            passwordHash,
            activeRole: RoleKey.ADMIN,
            isActive: true,
            isVerified: true,
            nodeId: nodeA.id,
            tenantId: tenantA.id,
        },
    });

    // Super Instructor A (Tenant A, Node A)
    const superInstructorA = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenantA.id, email: 'super-instructor-a@test.local' } },
        update: { passwordHash, activeRole: RoleKey.SUPER_INSTRUCTOR },
        create: {
            username: 'super_instructor_a',
            email: 'super-instructor-a@test.local',
            firstName: 'SuperInstructor',
            lastName: 'NodeA',
            passwordHash,
            activeRole: RoleKey.SUPER_INSTRUCTOR,
            isActive: true,
            isVerified: true,
            nodeId: nodeA.id,
            tenantId: tenantA.id,
        },
    });

    // Instructor A (Tenant A, Node A)
    const instructorA = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenantA.id, email: 'instructor-a@test.local' } },
        update: { passwordHash, activeRole: RoleKey.INSTRUCTOR },
        create: {
            username: 'instructor_a',
            email: 'instructor-a@test.local',
            firstName: 'Instructor',
            lastName: 'NodeA',
            passwordHash,
            activeRole: RoleKey.INSTRUCTOR,
            isActive: true,
            isVerified: true,
            nodeId: nodeA.id,
            tenantId: tenantA.id,
        },
    });

    // Learner A (Tenant A, Node A)
    const learnerA = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenantA.id, email: 'learner-a@test.local' } },
        update: { passwordHash, activeRole: RoleKey.LEARNER },
        create: {
            username: 'learner_a',
            email: 'learner-a@test.local',
            firstName: 'Learner',
            lastName: 'NodeA',
            passwordHash,
            activeRole: RoleKey.LEARNER,
            isActive: true,
            isVerified: true,
            nodeId: nodeA.id,
            tenantId: tenantA.id,
        },
    });

    // Learner B (Tenant A, Node B) - for node isolation tests
    const learnerB = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenantA.id, email: 'learner-b@test.local' } },
        update: { passwordHash, activeRole: RoleKey.LEARNER },
        create: {
            username: 'learner_b',
            email: 'learner-b@test.local',
            firstName: 'Learner',
            lastName: 'NodeB',
            passwordHash,
            activeRole: RoleKey.LEARNER,
            isActive: true,
            isVerified: true,
            nodeId: nodeB.id,
            tenantId: tenantA.id,
        },
    });

    // Instructor B (Tenant A, Node B) - for node isolation tests
    const instructorB = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenantA.id, email: 'instructor-b@test.local' } },
        update: { passwordHash, activeRole: RoleKey.INSTRUCTOR },
        create: {
            username: 'instructor_b',
            email: 'instructor-b@test.local',
            firstName: 'Instructor',
            lastName: 'NodeB',
            passwordHash,
            activeRole: RoleKey.INSTRUCTOR,
            isActive: true,
            isVerified: true,
            nodeId: nodeB.id,
            tenantId: tenantA.id,
        },
    });

    // Admin B (Tenant B) - for tenant isolation tests
    const adminB = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenantB.id, email: 'admin-b@test.local' } },
        update: { passwordHash, activeRole: RoleKey.ADMIN },
        create: {
            username: 'admin_b',
            email: 'admin-b@test.local',
            firstName: 'Admin',
            lastName: 'TenantB',
            passwordHash,
            activeRole: RoleKey.ADMIN,
            isActive: true,
            isVerified: true,
            nodeId: nodeC.id,
            tenantId: tenantB.id,
        },
    });

    // Create UserRole entries
    const roles = [
        { tenantId: tenantA.id, userId: adminA.id, roleKey: RoleKey.ADMIN },
        { tenantId: tenantA.id, userId: superInstructorA.id, roleKey: RoleKey.SUPER_INSTRUCTOR },
        { tenantId: tenantA.id, userId: instructorA.id, roleKey: RoleKey.INSTRUCTOR },
        { tenantId: tenantA.id, userId: instructorB.id, roleKey: RoleKey.INSTRUCTOR },
        { tenantId: tenantA.id, userId: learnerA.id, roleKey: RoleKey.LEARNER },
        { tenantId: tenantA.id, userId: learnerB.id, roleKey: RoleKey.LEARNER },
        { tenantId: tenantB.id, userId: adminB.id, roleKey: RoleKey.ADMIN },
    ];

    for (const role of roles) {
        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: role.tenantId, userId: role.userId, roleKey: role.roleKey } },
            update: {},
            create: role,
        });
    }

    // ============================================
    // CATEGORIES
    // ============================================
    console.log('📁 Creating categories...');

    let categoryA = await prisma.category.findFirst({ where: { name: 'Test Category A' } });
    if (!categoryA) {
        categoryA = await prisma.category.create({
            data: {
                tenantId: tenantA.id,
                name: 'Test Category A',
                description: 'Primary test category',
            },
        });
    }

    // ============================================
    // GROUPS
    // ============================================
    console.log('👪 Creating groups...');

    let groupA = await prisma.group.findFirst({ where: { name: 'Test Group A' } });
    if (!groupA) {
        groupA = await prisma.group.create({
            data: {
                tenantId: tenantA.id,
                name: 'Test Group A',
                description: 'Primary test group for Node A',
                instructorId: instructorA.id,
            },
        });
    }

    // Add learner A to group
    await prisma.groupMember.upsert({
        where: { tenantId_groupId_userId: { tenantId: tenantA.id, groupId: groupA.id, userId: learnerA.id } },
        update: {},
        create: { tenantId: tenantA.id, groupId: groupA.id, userId: learnerA.id },
    });

    // ============================================
    // COURSES
    // ============================================
    console.log('📚 Creating courses...');

    // Course A (Node A)
    let courseA = await prisma.course.findFirst({ where: { code: 'TEST-COURSE-A' } });
    if (!courseA) {
        courseA = await prisma.course.create({
            data: {
                tenantId: tenantA.id,
                code: 'TEST-COURSE-A',
                title: 'Test Course A',
                description: 'Primary test course for Node A',
                status: CourseStatus.PUBLISHED,
                isActive: true,
                instructorId: instructorA.id,
            },
        });
    }

    // Course B (Node B) - for node isolation tests
    let courseB = await prisma.course.findFirst({ where: { code: 'TEST-COURSE-B' } });
    if (!courseB) {
        courseB = await prisma.course.create({
            data: {
                tenantId: tenantA.id,
                code: 'TEST-COURSE-B',
                title: 'Test Course B',
                description: 'Test course for Node B (isolation tests)',
                status: CourseStatus.PUBLISHED,
                isActive: true,
                instructorId: instructorB.id,
            },
        });
    }

    // ============================================
    // COURSE SECTIONS + UNITS
    // ============================================
    console.log('📖 Creating course sections and units...');

    // Section 1 for Course A
    let sectionA = await prisma.courseSection.findFirst({
        where: { courseId: courseA.id, title: 'Section 1: Introduction' }
    });
    if (!sectionA) {
        sectionA = await prisma.courseSection.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseA.id,
                title: 'Section 1: Introduction',
                orderIndex: 0,
            },
        });
    }

    // Unit: Video
    let unitVideo = await prisma.courseUnit.findFirst({
        where: { courseId: courseA.id, title: 'Welcome Video' }
    });
    if (!unitVideo) {
        unitVideo = await prisma.courseUnit.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseA.id,
                sectionId: sectionA.id,
                type: UnitType.VIDEO,
                title: 'Welcome Video',
                status: UnitStatus.PUBLISHED,
                orderIndex: 0,
                config: { videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
            },
        });
    }

    // Unit: Document
    let unitDocument = await prisma.courseUnit.findFirst({
        where: { courseId: courseA.id, title: 'Course Overview Document' }
    });
    if (!unitDocument) {
        unitDocument = await prisma.courseUnit.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseA.id,
                sectionId: sectionA.id,
                type: UnitType.DOCUMENT,
                title: 'Course Overview Document',
                status: UnitStatus.PUBLISHED,
                orderIndex: 1,
                config: { content: '<h1>Welcome</h1><p>This is the course overview.</p>' },
            },
        });
    }

    // Ensure Course B has at least one section and unit
    let sectionB = await prisma.courseSection.findFirst({
        where: { courseId: courseB.id, title: 'Section B: Intro' }
    });
    if (!sectionB) {
        sectionB = await prisma.courseSection.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseB.id,
                title: 'Section B: Intro',
                orderIndex: 0,
            },
        });
    }
    let unitB1 = await prisma.courseUnit.findFirst({
        where: { courseId: courseB.id, title: 'Welcome to Course B' }
    });
    if (!unitB1) {
        unitB1 = await prisma.courseUnit.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseB.id,
                sectionId: sectionB.id,
                type: UnitType.TEXT,
                title: 'Welcome to Course B',
                status: UnitStatus.PUBLISHED,
                orderIndex: 0,
                config: { html: '<p>Welcome!</p>' },
            },
        });
    }

    // Section 2 with Quiz
    let section2 = await prisma.courseSection.findFirst({
        where: { courseId: courseA.id, title: 'Section 2: Assessment' }
    });
    if (!section2) {
        section2 = await prisma.courseSection.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseA.id,
                title: 'Section 2: Assessment',
                orderIndex: 1,
            },
        });
    }

    // Unit: Quiz
    let unitQuiz = await prisma.courseUnit.findFirst({
        where: { courseId: courseA.id, title: 'Knowledge Check Quiz' }
    });
    if (!unitQuiz) {
        unitQuiz = await prisma.courseUnit.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseA.id,
                sectionId: section2.id,
                type: UnitType.TEST,
                title: 'Knowledge Check Quiz',
                status: UnitStatus.PUBLISHED,
                orderIndex: 2,
                config: {
                    questions: [
                        {
                            question: 'What is 2 + 2?',
                            options: ['3', '4', '5'],
                            correctAnswer: '4',
                        },
                    ],
                    passingScore: 70,
                },
            },
        });
    }

    // ============================================
    // LEARNING PATHS
    // ============================================
    console.log('🛤️ Creating learning paths...');

    let lpA = await prisma.learningPath.findFirst({ where: { code: 'TEST-LP-A' } });
    if (!lpA) {
        lpA = await prisma.learningPath.create({
            data: {
                tenantId: tenantA.id,
                name: 'Test Learning Path A',
                code: 'TEST-LP-A',
                description: 'Primary test learning path',
                isActive: true,
                status: 'active',
                instructorId: instructorA.id,
            },
        });

        // Add course A to learning path
        await prisma.learningPathCourse.create({
            data: {
                tenantId: tenantA.id,
                pathId: lpA.id,
                courseId: courseA.id,
                order: 0,
            },
        });
    }

    // ============================================
    // ENROLLMENTS
    // ============================================
    console.log('✅ Creating enrollments...');

    // Enroll learner A in course A
    const enrollmentA = await prisma.enrollment.upsert({
        where: { tenantId_userId_courseId: { tenantId: tenantA.id, userId: learnerA.id, courseId: courseA.id } },
        update: {},
        create: {
            tenantId: tenantA.id,
            userId: learnerA.id,
            courseId: courseA.id,
            status: EnrollmentStatus.IN_PROGRESS,
            progress: 0,
        },
    });

    // Enroll learner B in course B (for node isolation tests)
    const enrollmentB = await prisma.enrollment.upsert({
        where: { tenantId_userId_courseId: { tenantId: tenantA.id, userId: learnerB.id, courseId: courseB.id } },
        update: {},
        create: {
            tenantId: tenantA.id,
            userId: learnerB.id,
            courseId: courseB.id,
            status: EnrollmentStatus.IN_PROGRESS,
            progress: 0,
        },
    });

    // Enroll learner A in learning path A
    const lpEnrollmentA = await prisma.learningPathEnrollment.upsert({
        where: { tenantId_userId_pathId: { tenantId: tenantA.id, userId: learnerA.id, pathId: lpA.id } },
        update: {},
        create: {
            tenantId: tenantA.id,
            userId: learnerA.id,
            pathId: lpA.id,
            status: 'IN_PROGRESS',
            progress: 0,
        },
    });

    // ============================================
    // ASSIGNMENTS + SUBMISSIONS
    // ============================================
    console.log('📝 Creating assignments and submissions...');

    let assignmentA = await prisma.assignment.findFirst({ where: { title: 'Test Assignment A' } });
    if (!assignmentA) {
        assignmentA = await prisma.assignment.create({
            data: {
                tenantId: tenantA.id,
                title: 'Test Assignment A',
                description: 'Primary test assignment',
                courseId: courseA.id,
                createdBy: instructorA.id,
                dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            },
        });
    }

    // Note: AssignmentSubmission uses different field names in the actual schema
    // For now, we'll skip creating a test submission as the model structure differs
    // This can be revisited when the Assignment model is confirmed
    const submissionAId = 'placeholder-submission-id';

    // ============================================
    // SKILLS
    // ============================================
    console.log('🎯 Creating skills...');

    let skillA = await prisma.skill.findFirst({ where: { name: 'Test Skill A' } });
    if (!skillA) {
        skillA = await prisma.skill.create({
            data: {
                tenantId: tenantA.id,
                name: 'Test Skill A',
                description: 'Primary test skill',
            },
        });

        // Link skill to course
        await prisma.courseSkill.create({
            data: {
                tenantId: tenantA.id,
                courseId: courseA.id,
                skillId: skillA.id,
                weight: 1,
            },
        });

        // Create user skill for learner A
        await prisma.userSkill.create({
            data: {
                tenantId: tenantA.id,
                userId: learnerA.id,
                skillId: skillA.id,
                progress: 25,
            },
        });
    }

    // ============================================
    // CONFERENCES
    // ============================================
    console.log('📹 Creating conferences...');

    let conferenceA = await prisma.conference.findFirst({ where: { title: 'Test Conference A' } });
    if (!conferenceA) {
        conferenceA = await prisma.conference.create({
            data: {
                tenantId: tenantA.id,
                title: 'Test Conference A',
                description: 'Primary test conference',
                instructorId: instructorA.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                duration: 60,
                meetingUrl: 'https://meet.example.com/test',
            },
        });
    }

    // ============================================
    // CALENDAR EVENTS
    // ============================================
    console.log('📅 Creating calendar events...');

    let calendarEventA = await prisma.calendarEvent.findFirst({ where: { title: 'Test Calendar Event A' } });
    if (!calendarEventA) {
        calendarEventA = await prisma.calendarEvent.create({
            data: {
                tenantId: tenantA.id,
                title: 'Test Calendar Event A',
                description: 'Primary test calendar event',
                instructorId: instructorA.id,
                type: 'meeting',
                startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
            },
        });
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================
    console.log('🔔 Creating notifications...');

    let notificationA = await prisma.notification.findFirst({ where: { name: 'Test Notification A' } });
    if (!notificationA) {
        notificationA = await prisma.notification.create({
            data: {
                tenantId: tenantA.id,
                name: 'Test Notification A',
                eventKey: 'course_enrollment',
                recipientType: 'learner',
                messageSubject: 'Welcome to the course',
                messageBody: 'You have been enrolled in {{courseName}}.',
                isActive: true,
            },
        });
    }

    // ============================================
    // AUTOMATIONS
    // ============================================
    console.log('⚙️ Creating automations...');

    let automationA = await prisma.automation.findFirst({ where: { name: 'Test Automation A' } });
    if (!automationA) {
        automationA = await prisma.automation.create({
            data: {
                tenantId: tenantA.id,
                name: 'Test Automation A',
                type: 'enrollment',
                parameters: { action: 'auto_enroll', targetGroup: groupA.id },
                enabled: false,
            },
        });
    }

    // ============================================
    // GAMIFICATION
    // ============================================
    console.log('🎮 Creating gamification settings...');

    let gamification = await prisma.gamificationSettings.findFirst({});
    if (!gamification) {
        await prisma.gamificationSettings.create({
            data: {
                tenantId: tenantA.id,
                enabled: true,
                pointsEnabled: true,
                badgesEnabled: true,
                levelsEnabled: true,
                leaderboardEnabled: true,
                pointsPerLogin: 10,
                maxLevel: 20,
            },
        });
    }

    // ============================================
    // EXPORT FIXTURES
    // ============================================
    console.log('\n📄 Exporting fixtures to seed.json...');

    const fixtures: SeedFixtures = {
        tenantAId: tenantA.id,
        tenantBId: tenantB.id,
        nodeAId: nodeA.id,
        nodeBId: nodeB.id,
        nodeCId: nodeC.id,
        adminAId: adminA.id,
        adminAEmail: adminA.email,
        superInstructorAId: superInstructorA.id,
        superInstructorAEmail: superInstructorA.email,
        instructorAId: instructorA.id,
        instructorAEmail: instructorA.email,
        instructorBId: instructorB.id,
        instructorBEmail: instructorB.email,
        learnerAId: learnerA.id,
        learnerAEmail: learnerA.email,
        learnerBId: learnerB.id,
        learnerBEmail: learnerB.email,
        adminBId: adminB.id,
        adminBEmail: adminB.email,
        categoryAId: categoryA.id,
        groupAId: groupA.id,
        courseAId: courseA.id,
        courseBId: courseB.id,
        sectionAId: sectionA.id,
        unitVideoId: unitVideo.id,
        unitDocumentId: unitDocument.id,
        unitQuizId: unitQuiz.id,
        lpAId: lpA.id,
        enrollmentAId: enrollmentA.id,
        enrollmentBId: enrollmentB.id,
        lpEnrollmentAId: lpEnrollmentA.id,
        assignmentAId: assignmentA.id,
        submissionAId: submissionAId,
        skillAId: skillA.id,
        conferenceAId: conferenceA.id,
        calendarEventAId: calendarEventA.id,
        notificationAId: notificationA.id,
        automationAId: automationA.id,
        testPassword: TEST_PASSWORD,
    };

    // Ensure fixtures directory exists
    const fixturesDir = path.join(process.cwd(), 'tests', 'e2e', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
    }

    const fixturesPath = path.join(fixturesDir, 'seed.json');
    fs.writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 2));

    console.log(`\n✅ Seed complete! Fixtures exported to: ${fixturesPath}`);
    console.log('\n📋 Summary:');
    console.log(`   Tenants: 2`);
    console.log(`   Branches: 3`);
    console.log(`   Users: 6`);
    console.log(`   Courses: 2 (with sections + units)`);
    console.log(`   Learning Paths: 1`);
    console.log(`   Enrollments: 3`);
    console.log(`   Assignments: 1`);
    console.log(`   Skills: 1`);

    return fixtures;
}

seed()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
