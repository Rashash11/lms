import { PrismaClient, RoleKey, UnitType, UnitStatus, CourseStatus, EnrollmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data for a clean seed (important for E2E UUID consistency)
    console.log('🧹 Clearing database...');

    const clearTable = async (name: string, delegate: any) => {
        try {
            // Check if count or deleteMany exists (to be safe with any cast)
            if (!delegate || !delegate.deleteMany) {
                console.warn(`Skipping ${name} (delegate not found or missing deleteMany)`);
                return;
            }

            // Just try deleteMany directly to handle tables without count (though all should have it)
            // But getting count first is good debug info.
            let count = -1;
            try { count = await delegate.count(); } catch (e) { }

            console.log(`Clearing ${name} (${count >= 0 ? count + ' rows' : 'unknown'})...`);
            await delegate.deleteMany();
            console.log(`✅ Deleted ${name}`);
        } catch (error: any) {
            console.error(`❌ FAILED to delete ${name}:`, error.message || error);
            // Don't throw, let other cleanups proceed (best effort)
        }
    };

    // Level 5: Deeply nested course/user state
    await clearTable('unitAsset', prisma.unitAsset);
    await clearTable('sCORMData', prisma.sCORMData);
    await clearTable('attachment', prisma.attachment);
    await clearTable('discussionComment', prisma.discussionComment);
    await clearTable('groupCourse', prisma.groupCourse);
    await clearTable('groupMember', prisma.groupMember);
    await clearTable('courseFile', prisma.courseFile);
    await clearTable('courseInstructor', prisma.courseInstructor);
    await clearTable('userSkill', prisma.userSkill);
    await clearTable('courseSkill', prisma.courseSkill);
    await clearTable('skillRecommendation', prisma.skillRecommendation);
    await clearTable('learningPathEnrollment', prisma.learningPathEnrollment);
    await clearTable('learningPathCourse', prisma.learningPathCourse);
    await clearTable('certificateIssue', prisma.certificateIssue);
    await clearTable('calendarEvent', prisma.calendarEvent);
    await clearTable('conference', prisma.conference);
    await clearTable('automationLog', prisma.automationLog);

    // Level 4: Course interactions & Sub-entities
    await clearTable('learnerCourseState', prisma.learnerCourseState);
    await clearTable('testAttempt', prisma.testAttempt);
    await clearTable('courseRating', prisma.courseRating);
    await clearTable('assignmentSubmission', prisma.assignmentSubmission);
    await clearTable('enrollmentExtension', prisma.enrollmentExtension);
    await clearTable('enrollmentRequest', prisma.enrollmentRequest);
    await clearTable('timelineEvent', prisma.timelineEvent);
    await clearTable('messageRecipient', prisma.messageRecipient);
    await clearTable('notification', prisma.notification);
    await clearTable('fileVisibility', prisma.fileVisibility);
    await clearTable('iltAttendance', prisma.iLTAttendance);
    await clearTable('question', prisma.question);
    await clearTable('questionPool', prisma.questionPool);
    await clearTable('freeTextKeyword', prisma.freeTextKeyword);

    // Level 3: Structural content
    await clearTable('courseUnit', prisma.courseUnit);
    await clearTable('courseSection', prisma.courseSection);
    await clearTable('enrollment', prisma.enrollment);
    await clearTable('passwordResetToken', prisma.passwordResetToken);
    await clearTable('message', prisma.message);
    await clearTable('discussion', prisma.discussion);
    await clearTable('test', prisma.test);
    await clearTable('assignment', prisma.assignment);
    await clearTable('iltSession', prisma.iLTSession);
    await clearTable('file', prisma.file);
    await clearTable('automation', prisma.automation);

    // Level 2: Core entities
    await clearTable('skill', prisma.skill); // <-- Added
    await clearTable('learningPath', prisma.learningPath); // <-- Added
    await clearTable('course', prisma.course);
    await clearTable('userRole', prisma.userRole);
    await clearTable('group', prisma.group);
    await clearTable('user', prisma.user);
    await clearTable('category', prisma.category);
    await clearTable('portalFeatureFlags', prisma.portalFeatureFlags);
    await clearTable('importJob', prisma.importJob);
    await clearTable('userType', prisma.userType);
    await clearTable('authPermission', prisma.authPermission);
    await clearTable('authRole', prisma.authRole); // Careful with global roles

    // Level 1: Tenants & Base
    await clearTable('branch', prisma.branch);
    await clearTable('tenant', prisma.tenant);

    console.log('🧹 Database clearance steps completed (check for errors above)');

    // Create default tenant (Tenant A)
    const tenant = await prisma.tenant.upsert({
        where: { id: '62143487-327a-4280-96a4-f21911acae95' },
        update: {},
        create: {
            id: '62143487-327a-4280-96a4-f21911acae95',
            domain: 'default.talentlms.local',
            name: 'Default Portal',
            settings: { theme: 'default', language: 'en' },
        },
    });
    console.log('✅ Created tenant:', tenant.name);

    // Create second tenant for isolation tests
    const tenantB = await prisma.tenant.upsert({
        where: { id: 'ecbc1331-8793-4c2a-8b8e-9764cb53d97f' },
        update: {},
        create: {
            id: 'ecbc1331-8793-4c2a-8b8e-9764cb53d97f',
            domain: 'tenant-b.talentlms.local',
            name: 'Tenant B Portal',
            settings: { theme: 'dark', language: 'en' },
        },
    });
    console.log('✅ Created second tenant:', tenantB.name);

    // Initialize global RBAC data
    console.log('🔐 Initializing global RBAC data...');
    const rolesToSeed = ['ADMIN', 'INSTRUCTOR', 'LEARNER', 'SUPER_INSTRUCTOR'];
    const roleMap: Record<string, any> = {};

    for (const roleName of rolesToSeed) {
        const r = await prisma.authRole.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName, description: `${roleName} role` }
        });
        roleMap[roleName] = r;
    }

    // Define permissions
    const allPermissions = [
        // Course
        'course:read', 'course:create', 'course:update', 'course:update_any', 'course:publish', 'course:delete', 'course:delete_any',
        // Unit
        'unit:read', 'unit:create', 'unit:update', 'unit:update_any', 'unit:publish', 'unit:delete', 'unit:delete_any',
        // Learning Paths
        'learning_path:read', 'learning_path:create', 'learning_path:update', 'learning_path:delete',
        // Users
        'user:read', 'user:create', 'user:update', 'user:delete', 'user:assign_role', 'user:assign_permission', 'user:impersonate',
        // Dashboard
        'dashboard:read',
        // Assignments
        'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
        // Submissions
        'submission:read', 'submission:grade', 'submission:publish', 'submission:download', 'submission:create',
        // Reports
        'reports:read', 'reports:export',
        // Calendar
        'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
        // Conference
        'conference:read', 'conference:create', 'conference:update', 'conference:delete',
        // Skills
        'skills:read', 'skills:update', 'skills:create', 'skills:delete',
        // Security
        'security:sessions:read', 'security:sessions:revoke', 'security:audit:read',
        // Certificates
        'certificate:template:read', 'certificate:template:create', 'certificate:template:update', 'certificate:template:delete',
        'certificate:issue:read', 'certificate:issue:create', 'certificate:view_own',
        // Admin
        'roles:read', 'permissions:read', 'organization:read'
    ];

    const permMap: Record<string, any> = {};
    for (const permName of allPermissions) {
        const p = await prisma.authPermission.upsert({
            where: { name: permName },
            update: {},
            create: { name: permName, fullPermission: permName, description: permName }
        });
        permMap[permName] = p;
    }

    // Map Roles to Permissions
    const rolePermissions: Record<string, string[]> = {
        ADMIN: allPermissions,
        SUPER_INSTRUCTOR: [
            'dashboard:read',
            'course:read', 'course:create', 'course:update', 'course:update_any', 'course:publish', 'course:delete',
            'unit:read', 'unit:create', 'unit:update', 'unit:update_any', 'unit:publish', 'unit:delete',
            'learning_path:read', 'learning_path:create', 'learning_path:update', 'learning_path:delete',
            'user:read', 'user:create', 'user:update', 'user:delete',
            'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
            'submission:read', 'submission:grade', 'submission:publish', 'submission:download',
            'reports:read', 'reports:export',
            'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
            'conference:read', 'conference:create', 'conference:update', 'conference:delete',
            'skills:read', 'skills:update', 'skills:create', 'skills:delete',
            'certificate:template:read', 'certificate:template:create', 'certificate:template:update', 'certificate:template:delete',
            'certificate:issue:read'
        ],
        INSTRUCTOR: [
            'dashboard:read',
            'course:read', 'course:create', 'course:update', 'course:publish',
            'unit:read', 'unit:create', 'unit:update', 'unit:publish', 'unit:delete',
            'learning_path:read', 'learning_path:create', 'learning_path:update',
            'user:read',
            'assignment:read', 'assignment:create', 'assignment:update', 'assignment:assign',
            'submission:read', 'submission:grade', 'submission:publish', 'submission:download',
            'reports:read',
            'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
            'conference:read', 'conference:create', 'conference:update', 'conference:delete',
            'skills:read',
            'certificate:template:read', 'certificate:issue:read'
        ],
        LEARNER: [
            'course:read',
            'unit:read',
            'learning_path:read',
            'assignment:read',
            'submission:read', 'submission:create',
            'calendar:read',
            'skills:read',
            'certificate:view_own'
        ]
    };

    // Seed AuthRolePermission
    for (const [roleName, perms] of Object.entries(rolePermissions)) {
        const role = roleMap[roleName];
        if (!role) continue;

        for (const permName of perms) {
            const perm = permMap[permName];
            if (!perm) continue;

            await prisma.authRolePermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
                update: {},
                create: { roleId: role.id, permissionId: perm.id }
            });
        }
    }

    console.log('✅ Initialized global roles and permissions');

    // Default branch for Tenant A (Node A)
    const branch = await prisma.branch.upsert({
        where: { id: '5e3d1e1a-d367-4047-b842-95e3a427dfa4' },
        update: { isActive: true },
        create: {
            id: '5e3d1e1a-d367-4047-b842-95e3a427dfa4',
            tenantId: tenant.id,
            name: 'Main Branch',
            slug: 'main',
            title: 'Main Training Portal',
            description: 'The main training portal for all employees',
            isActive: true,
            settings: {},
        },
    });
    console.log('✅ Created Node A:', branch.name);

    // Second branch for Tenant A (Node B)
    const branchB = await prisma.branch.upsert({
        where: { id: '6ea12a24-c55c-4e08-8204-473844aaed2b' },
        update: { isActive: true },
        create: {
            id: '6ea12a24-c55c-4e08-8204-473844aaed2b',
            tenantId: tenant.id,
            name: 'Secondary Branch',
            slug: 'secondary',
            title: 'Node B',
            isActive: true,
            settings: {},
        },
    });
    console.log('✅ Created Node B:', branchB.name);

    const branchC = await prisma.branch.upsert({
        where: { id: 'b5a4ead2-ed77-45c1-85ea-c4522902b39f' },
        update: { isActive: true },
        create: {
            id: 'b5a4ead2-ed77-45c1-85ea-c4522902b39f',
            tenantId: tenantB.id,
            name: 'Branch C',
            slug: 'branch-c',
            title: 'Tenant B Branch',
            description: 'Isolated branch in Tenant B',
            isActive: true,
            settings: {},
        },
    });
    console.log('✅ Created Node C (Tenant B):', branchC.name);

    // Admin-A user for smoke tests (matches scripts/auth-smoke-test.ts)
    const adminAPassword = await bcrypt.hash('TestPass123!', 12);
    const adminA = await prisma.user.upsert({
        where: { id: '32199d74-d654-4646-a050-ec804382adf8' },
        update: { passwordHash: adminAPassword, activeRole: 'ADMIN' },
        create: {
            id: '32199d74-d654-4646-a050-ec804382adf8',
            username: 'admin-a',
            email: 'admin-a@test.local',
            firstName: 'Admin',
            lastName: 'A',
            passwordHash: adminAPassword,
            status: 'ACTIVE',
            activeRole: 'ADMIN',
            tenantId: tenant.id,
            nodeId: branch.id,
        },
    });

    for (const roleKey of ['ADMIN', 'INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: adminA.id, roleKey } },
            update: {},
            create: { tenantId: tenant.id, userId: adminA.id, roleKey },
        });
    }
    console.log('✅ Created smoke test admin user: admin-a@test.local / TestPass123!');

    // Admin user (original)
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'admin@portal.com' } },
        update: { passwordHash: adminPassword, activeRole: 'ADMIN' },
        create: {
            username: 'admin',
            email: 'admin@portal.com',
            firstName: 'System',
            lastName: 'Administrator',
            passwordHash: adminPassword,
            status: 'ACTIVE',
            activeRole: 'ADMIN',
            tenantId: tenant.id,
        },
    });

    for (const roleKey of ['ADMIN', 'INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: admin.id, roleKey } },
            update: {},
            create: { tenantId: tenant.id, userId: admin.id, roleKey },
        });
    }
    console.log('✅ Created admin user: admin@portal.com / Admin123!');

    // Admin-B user (Tenant B)
    const adminBPassword = await bcrypt.hash('TestPass123!', 12);
    const adminB = await prisma.user.upsert({
        where: { id: 'a54065c6-029e-472a-a5b3-172fd4174445' },
        update: { passwordHash: adminBPassword, activeRole: 'ADMIN' },
        create: {
            id: 'a54065c6-029e-472a-a5b3-172fd4174445',
            username: 'admin-b',
            email: 'admin-b@test.local',
            firstName: 'Admin',
            lastName: 'B',
            passwordHash: adminBPassword,
            status: 'ACTIVE',
            activeRole: 'ADMIN',
            tenantId: tenantB.id,
            nodeId: branchC.id,
        },
    });
    await prisma.userRole.upsert({
        where: { tenantId_userId_roleKey: { tenantId: tenantB.id, userId: adminB.id, roleKey: 'ADMIN' } },
        update: {},
        create: { tenantId: tenantB.id, userId: adminB.id, roleKey: 'ADMIN' },
    });
    console.log('✅ Created Tenant B admin user: admin-b@test.local / TestPass123!');

    // Super-Instructor-A user
    const superInstructorAPassword = await bcrypt.hash('TestPass123!', 12);
    const superInstructorA = await prisma.user.upsert({
        where: { id: '66d0d8d4-2b35-46a0-a07e-5925d5c8c71c' },
        update: { passwordHash: superInstructorAPassword, activeRole: 'SUPER_INSTRUCTOR' },
        create: {
            id: '66d0d8d4-2b35-46a0-a07e-5925d5c8c71c',
            username: 'super-instructor-a',
            email: 'super-instructor-a@test.local',
            firstName: 'Super',
            lastName: 'Instructor',
            passwordHash: superInstructorAPassword,
            status: 'ACTIVE',
            activeRole: 'SUPER_INSTRUCTOR',
            tenantId: tenant.id,
        },
    });
    await prisma.userRole.upsert({
        where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: superInstructorA.id, roleKey: 'SUPER_INSTRUCTOR' } },
        update: {},
        create: { tenantId: tenant.id, userId: superInstructorA.id, roleKey: 'SUPER_INSTRUCTOR' },
    });
    console.log('✅ Created super instructor: super-instructor-a@test.local / TestPass123!');

    // Instructor-A user for smoke tests (matches scripts/user-rbac-smoke-test.ts)
    const instructorAPassword = await bcrypt.hash('TestPass123!', 12);
    const instructorA = await prisma.user.upsert({
        where: { id: '030673eb-5d19-44a1-9916-373994715700' },
        update: { passwordHash: instructorAPassword, activeRole: 'INSTRUCTOR' },
        create: {
            id: '030673eb-5d19-44a1-9916-373994715700',
            username: 'instructor-a',
            email: 'instructor-a@test.local',
            firstName: 'Instructor',
            lastName: 'A',
            passwordHash: instructorAPassword,
            status: 'ACTIVE',
            activeRole: 'INSTRUCTOR',
            tenantId: tenant.id,
            nodeId: branch.id,
        },
    });

    for (const roleKey of ['INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: instructorA.id, roleKey } },
            update: {},
            create: { tenantId: tenant.id, userId: instructorA.id, roleKey },
        });
    }
    console.log('✅ Created smoke test instructor user: instructor-a@test.local / TestPass123!');

    // Instructor-B user (Tenant B)
    const instructorBPassword = await bcrypt.hash('TestPass123!', 12);
    const instructorB = await prisma.user.upsert({
        where: { id: '70e8b5f8-7e22-4216-ac74-26f6d3955616' },
        update: { passwordHash: instructorBPassword, activeRole: 'INSTRUCTOR' },
        create: {
            id: '70e8b5f8-7e22-4216-ac74-26f6d3955616',
            username: 'instructor-b',
            email: 'instructor-b@test.local',
            firstName: 'Instructor',
            lastName: 'B',
            passwordHash: instructorBPassword,
            status: 'ACTIVE',
            activeRole: 'INSTRUCTOR',
            tenantId: tenantB.id,
            nodeId: branchC.id,
        },
    });
    await prisma.userRole.upsert({
        where: { tenantId_userId_roleKey: { tenantId: tenantB.id, userId: instructorB.id, roleKey: 'INSTRUCTOR' } },
        update: {},
        create: { tenantId: tenantB.id, userId: instructorB.id, roleKey: 'INSTRUCTOR' },
    });
    console.log('✅ Created Tenant B instructor user: instructor-b@test.local / TestPass123!');

    // Learner-A user for smoke tests (matches scripts/rbac-smoke-test.ts)
    const learnerAPassword = await bcrypt.hash('TestPass123!', 12);
    const learnerA = await prisma.user.upsert({
        where: { id: 'ee90d301-d784-4859-9f16-06fac99fadc8' },
        update: { passwordHash: learnerAPassword, activeRole: 'LEARNER' },
        create: {
            id: 'ee90d301-d784-4859-9f16-06fac99fadc8',
            username: 'learner-a',
            email: 'learner-a@test.local',
            firstName: 'Learner',
            lastName: 'A',
            passwordHash: learnerAPassword,
            status: 'ACTIVE',
            activeRole: 'LEARNER',
            tenantId: tenant.id,
            nodeId: branch.id,
        },
    });

    await prisma.userRole.upsert({
        where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: learnerA.id, roleKey: 'LEARNER' } },
        update: {},
        create: { tenantId: tenant.id, userId: learnerA.id, roleKey: 'LEARNER' },
    });
    console.log('✅ Created smoke test learner user: learner-a@test.local / TestPass123!');

    // Learner-B user for smoke tests (matches scripts/learner-smoke-test.ts)
    const learnerBPassword = await bcrypt.hash('TestPass123!', 12);
    const learnerB = await prisma.user.upsert({
        where: { id: 'b2cf399f-f73e-4274-a2e4-5c7268650497' },
        update: { passwordHash: learnerBPassword, activeRole: 'LEARNER' },
        create: {
            id: 'b2cf399f-f73e-4274-a2e4-5c7268650497',
            username: 'learner-b',
            email: 'learner-b@test.local',
            firstName: 'Learner',
            lastName: 'B',
            passwordHash: learnerBPassword,
            status: 'ACTIVE',
            activeRole: 'LEARNER',
            tenantId: tenant.id,
            nodeId: branch.id,
        },
    });

    await prisma.userRole.upsert({
        where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: learnerB.id, roleKey: 'LEARNER' } },
        update: {},
        create: { tenantId: tenant.id, userId: learnerB.id, roleKey: 'LEARNER' },
    });
    console.log('✅ Created smoke test learner user: learner-b@test.local / TestPass123!');

    // Instructor user (original)
    const instructorPassword = await bcrypt.hash('Instructor123!', 12);
    const instructor = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'instructor@portal.com' } },
        update: { passwordHash: instructorPassword, activeRole: 'INSTRUCTOR' },
        create: {
            username: 'instructor',
            email: 'instructor@portal.com',
            firstName: 'Jane',
            lastName: 'Instructor',
            passwordHash: instructorPassword,
            status: 'ACTIVE',
            activeRole: 'INSTRUCTOR',
            tenantId: tenant.id,
        },
    });

    for (const roleKey of ['INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: instructor.id, roleKey } },
            update: {},
            create: { tenantId: tenant.id, userId: instructor.id, roleKey },
        });
    }
    console.log('✅ Created instructor user: instructor@portal.com / Instructor123!');

    // Super Instructor user (has SUPER_INSTRUCTOR and LEARNER roles)
    const superInstructorPassword = await bcrypt.hash('Super123!', 12);
    const superInstructor = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'superinstructor@portal.com' } },
        update: { passwordHash: superInstructorPassword, activeRole: 'SUPER_INSTRUCTOR' },
        create: {
            username: 'superinstructor',
            email: 'superinstructor@portal.com',
            firstName: 'Sarah',
            lastName: 'Super',
            passwordHash: superInstructorPassword,
            status: 'ACTIVE',
            activeRole: 'SUPER_INSTRUCTOR',
            tenantId: tenant.id,
        },
    });

    for (const roleKey of ['SUPER_INSTRUCTOR', 'LEARNER'] as RoleKey[]) {
        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: superInstructor.id, roleKey } },
            update: {},
            create: { tenantId: tenant.id, userId: superInstructor.id, roleKey },
        });
    }
    console.log('✅ Created super instructor user: superinstructor@portal.com / Super123!');

    // Learner users - Create 50 learners with varied names
    const learnerPassword = await bcrypt.hash('Learner123!', 12);
    const learnerDataList = [
        { username: 'learner1', email: 'learner1@portal.com', firstName: 'John', lastName: 'Learner' },
        { username: 'learner2', email: 'learner2@portal.com', firstName: 'Jane', lastName: 'Student' },
        { username: 'learner3', email: 'learner3@portal.com', firstName: 'Bob', lastName: 'Trainee' },
        { username: 'ahmed_h', email: 'ahmed.hassan@portal.com', firstName: 'Ahmed', lastName: 'Hassan' },
        { username: 'sara_a', email: 'sara.ali@portal.com', firstName: 'Sara', lastName: 'Ali' },
        { username: 'mohamed_i', email: 'mohamed.ibrahim@portal.com', firstName: 'Mohamed', lastName: 'Ibrahim' },
        { username: 'fatima_o', email: 'fatima.omar@portal.com', firstName: 'Fatima', lastName: 'Omar' },
        { username: 'omar_k', email: 'omar.khaled@portal.com', firstName: 'Omar', lastName: 'Khaled' },
        { username: 'layla_m', email: 'layla.mostafa@portal.com', firstName: 'Layla', lastName: 'Mostafa' },
        { username: 'youssef_a', email: 'youssef.ahmed@portal.com', firstName: 'Youssef', lastName: 'Ahmed' },
        { username: 'nour_s', email: 'nour.said@portal.com', firstName: 'Nour', lastName: 'Said' },
        { username: 'kareem_f', email: 'kareem.farouk@portal.com', firstName: 'Kareem', lastName: 'Farouk' },
        { username: 'mariam_e', email: 'mariam.elsayed@portal.com', firstName: 'Mariam', lastName: 'Elsayed' },
        { username: 'ali_h', email: 'ali.hassan@portal.com', firstName: 'Ali', lastName: 'Hassan' },
        { username: 'hana_m', email: 'hana.mahmoud@portal.com', firstName: 'Hana', lastName: 'Mahmoud' },
    ];

    const learners: Array<{ id: string; tenantId: string }> = [];
    for (let i = 0; i < learnerDataList.length; i++) {
        const learnerData = learnerDataList[i];
        const daysAgo = Math.floor(Math.random() * 30);
        const shouldHaveLogin = Math.random() > 0.15;
        const lastLoginAt = shouldHaveLogin
            ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
            : null;

        const learner = await prisma.user.upsert({
            where: { tenantId_email: { tenantId: tenant.id, email: learnerData.email } },
            update: { passwordHash: learnerPassword, lastLoginAt },
            create: {
                ...learnerData,
                passwordHash: learnerPassword,
                status: 'ACTIVE',
                activeRole: 'LEARNER',
                tenantId: tenant.id,
                lastLoginAt,
            },
        });

        await prisma.userRole.upsert({
            where: { tenantId_userId_roleKey: { tenantId: tenant.id, userId: learner.id, roleKey: 'LEARNER' } },
            update: {},
            create: { tenantId: tenant.id, userId: learner.id, roleKey: 'LEARNER' },
        });
        learners.push(learner);
    }

    // Add smoke test learners to the enrollment list
    learners.push(learnerA);
    learners.push(learnerB);

    console.log('✅ Created', learnerDataList.length + 2, 'learner users (including smoke tests)');


    // ======= CREATE COURSES =======
    const sampleCourses = [
        { code: 'JS101', title: 'Advanced JavaScript', description: 'Master modern JavaScript features and best practices', status: CourseStatus.PUBLISHED },
        { code: 'REACT101', title: 'React Fundamentals', description: 'Learn React from the ground up', status: CourseStatus.PUBLISHED },
        { code: 'NODE101', title: 'Node.js Backend Development', description: 'Build scalable backend applications with Node.js', status: CourseStatus.PUBLISHED },
        { code: 'PY101', title: 'Python Basics', description: 'Introduction to Python programming', status: CourseStatus.DRAFT },
        { code: 'TS101', title: 'TypeScript Mastery', description: 'Type-safe JavaScript development', status: CourseStatus.PUBLISHED },
    ];

    const createdCourses: Array<{ id: string; status: CourseStatus }> = [];
    for (const courseData of sampleCourses) {
        const course = await prisma.course.upsert({
            where: { tenantId_code: { tenantId: tenant.id, code: courseData.code } },
            update: {},
            create: { ...courseData, tenantId: tenant.id },
        });
        createdCourses.push(course);
    }
    console.log('✅ Created', sampleCourses.length, 'sample courses');

    // ======= ADD CONTENT TO COURSES =======
    for (const course of createdCourses) {
        // Clear existing content to avoid P2002/P2003
        await prisma.learnerCourseState.deleteMany({ where: { courseId: course.id, tenantId: tenant.id } });
        await prisma.courseUnit.deleteMany({ where: { courseId: course.id, tenantId: tenant.id } });
        await prisma.courseSection.deleteMany({ where: { courseId: course.id, tenantId: tenant.id } });

        const section = await prisma.courseSection.create({
            data: {
                tenantId: tenant.id,
                courseId: course.id,
                title: 'Introduction',
                orderIndex: 0,
            }
        });

        const unitTypes: UnitType[] = [UnitType.TEXT, UnitType.VIDEO, UnitType.TEXT];
        for (let i = 0; i < unitTypes.length; i++) {
            await prisma.courseUnit.create({
                data: {
                    tenantId: tenant.id,
                    courseId: course.id,
                    sectionId: section.id,
                    title: `Unit ${i + 1}`,
                    type: unitTypes[i],
                    status: UnitStatus.PUBLISHED,
                    orderIndex: i,
                    config: {},
                }
            });
        }
    }
    console.log('✅ Created sections and units for all courses');

    // ======= ENROLL LEARNERS WITH VARIED PROGRESS =======
    const enrollmentStatuses = [
        { status: EnrollmentStatus.COMPLETED, progressRange: [100, 100], weight: 0.30 },
        { status: EnrollmentStatus.IN_PROGRESS, progressRange: [25, 99], weight: 0.40 },
        { status: EnrollmentStatus.NOT_STARTED, progressRange: [0, 0], weight: 0.30 },
    ];

    for (const learner of learners) {
        for (const course of createdCourses) {
            if (course.status === CourseStatus.PUBLISHED) {
                const rand = Math.random();
                let cumWeight = 0;
                let selectedStatus = enrollmentStatuses[0];
                for (const es of enrollmentStatuses) {
                    cumWeight += es.weight;
                    if (rand <= cumWeight) {
                        selectedStatus = es;
                        break;
                    }
                }

                const progress = selectedStatus.progressRange[0] === selectedStatus.progressRange[1]
                    ? selectedStatus.progressRange[0]
                    : Math.floor(Math.random() * (selectedStatus.progressRange[1] - selectedStatus.progressRange[0] + 1)) + selectedStatus.progressRange[0];

                const daysAgo = Math.floor(Math.random() * 60) + 1;
                const completedAt = selectedStatus.status === EnrollmentStatus.COMPLETED
                    ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
                    : null;
                const startedAt = selectedStatus.status !== EnrollmentStatus.NOT_STARTED
                    ? new Date(Date.now() - (daysAgo + 30) * 24 * 60 * 60 * 1000)
                    : null;

                await prisma.enrollment.upsert({
                    where: { tenantId_userId_courseId: { tenantId: tenant.id, userId: learner.id, courseId: course.id } },
                    update: { status: selectedStatus.status, progress, completedAt, startedAt },
                    create: {
                        tenantId: tenant.id,
                        userId: learner.id,
                        courseId: course.id,
                        status: selectedStatus.status,
                        progress,
                        completedAt,
                        startedAt,
                    }
                });
            }
        }
    }
    console.log('✅ Enrolled learners with varied progress');


    // ======= CREATE CATEGORIES =======
    const rootCategory = await prisma.category.create({
        data: { name: 'All Courses', description: 'Root category', tenantId: tenant.id },
    }).catch(() => null);

    const categories = [
        { name: 'Development', description: 'Programming and software development courses' },
        { name: 'Design', description: 'UI/UX and graphic design courses' },
        { name: 'Management', description: 'Leadership and management training' },
    ];

    for (const catData of categories) {
        await prisma.category.create({
            data: { ...catData, parentId: rootCategory?.id, tenantId: tenant.id },
        }).catch(() => { });
    }
    console.log('✅ Created sample categories');

    // ======= CREATE TIMELINE EVENTS FOR ACTIVITY CHARTS =======
    const allCourses = await prisma.course.findMany({ where: { tenantId: tenant.id } });
    const allLearners = await prisma.user.findMany({ where: { tenantId: tenant.id, activeRole: 'LEARNER' } });
    const eventTypes = ['USER_LOGIN', 'COURSE_STARTED', 'COURSE_COMPLETED', 'UNIT_COMPLETED'];

    const eventPromises: Array<Promise<unknown>> = [];
    for (let i = 0; i < 100; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const eventDate = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);
        const randomLearner = allLearners[Math.floor(Math.random() * allLearners.length)];
        const randomCourse = allCourses[Math.floor(Math.random() * allCourses.length)];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        eventPromises.push(
            prisma.timelineEvent.create({
                data: {
                    tenantId: tenant.id,
                    userId: randomLearner?.id || admin.id,
                    courseId: eventType !== 'USER_LOGIN' ? randomCourse?.id : null,
                    eventType,
                    details: {
                        title: randomCourse?.title || 'System Login',
                        userName: `${randomLearner?.firstName || 'User'} ${randomLearner?.lastName || ''}`,
                    },
                    timestamp: eventDate,
                },
            }).catch(() => null)
        );
    }
    await Promise.all(eventPromises);
    console.log('✅ Created timeline events for activity charts');


    // ======= CREATE SKILLS =======
    const skills = [
        { name: 'JavaScript', description: 'Modern JavaScript (ES6+)', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png' },
        { name: 'React', description: 'Component-based UI development', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1126/1126012.png' },
        { name: 'TypeScript', description: 'Statically typed JavaScript', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968381.png' },
    ];

    for (const skillData of skills) {
        await prisma.skill.create({
            data: {
                tenantId: tenant.id,
                ...skillData
            }
        }).catch(() => { }); // Ignore if already exists
    }
    console.log('✅ Created skills');

    // ======= CREATE JOB ROLES =======
    const roles = [
        { name: 'Frontend Developer', description: 'Builds beautiful user interfaces.' },
        { name: 'Backend Architect', description: 'Designs scalable server-side systems.' },
    ];

    for (const roleData of roles) {
        await prisma.jobRole.create({
            data: {
                tenantId: tenant.id,
                ...roleData
            }
        }).catch(() => { }); // Ignore if already exists
    }
    console.log('✅ Created job roles');

    // ======= CREATE LEARNING PATHS =======
    const samplePaths = [
        { name: 'Modern Fullstack Developer', code: 'PATH-FS-01', description: 'Complete path from zero to hero in fullstack JS', status: 'published', isActive: true },
        { name: 'Frontend Excellence', code: 'PATH-FE-01', description: 'Deep dive into React and modern CSS', status: 'published', isActive: true },
    ];

    for (const pathData of samplePaths) {
        await prisma.learningPath.upsert({
            where: { tenantId_code: { tenantId: tenant.id, code: pathData.code } },
            update: {},
            create: {
                ...pathData,
                instructorId: instructor.id,
                tenantId: tenant.id,
            }
        });
    }
    console.log('✅ Created learning paths');

    // ======= CREATE STANDALONE ASSIGNMENTS =======
    const sampleAssignments = [
        { title: 'Project Proposal', description: 'Submit your final project proposal for review.', courseId: createdCourses[0].id },
        { title: 'Peer Review', description: 'Review two of your peers projects.', courseId: createdCourses[1].id },
    ];

    for (const assigData of sampleAssignments) {
        await prisma.assignment.create({
            data: {
                ...assigData,
                createdBy: admin.id,
                tenantId: tenant.id,
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
