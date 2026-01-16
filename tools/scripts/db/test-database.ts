import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
    console.log('\n🔍 DATABASE CONNECTION TEST\n');
    console.log('─'.repeat(50));

    try {
        // Test 1: Basic connection
        console.log('\n1. Testing connection...');
        await prisma.$connect();
        console.log('   ✅ Connected to database');

        // Test 2: Count tables
        console.log('\n2. Counting records in key tables...');
        const counts = await Promise.all([
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.course.count(),
            prisma.enrollment.count(),
            prisma.group.count(),
            prisma.learningPath.count(),
            prisma.authRole.count(),
            prisma.authPermission.count(),
        ]);

        const tableNames = ['Tenant', 'User', 'Course', 'Enrollment', 'Group', 'LearningPath', 'AuthRole', 'AuthPermission'];
        tableNames.forEach((name, i) => {
            console.log(`   ${name}: ${counts[i]} records`);
        });

        // Test 3: Verify relations - User with enrollments
        console.log('\n3. Testing User → Enrollment relation...');
        const userWithEnrollments = await prisma.user.findFirst({
            include: {
                enrollments: { take: 3 },
                roles: true,
            }
        });
        if (userWithEnrollments) {
            console.log(`   ✅ User "${userWithEnrollments.email}" has ${userWithEnrollments.enrollments.length} enrollments, ${userWithEnrollments.roles.length} roles`);
        } else {
            console.log('   ⚠️ No users found to test relations');
        }

        // Test 4: Verify relations - Course with sections and units
        console.log('\n4. Testing Course → Sections → Units relation...');
        const courseWithContent = await prisma.course.findFirst({
            include: {
                sections: {
                    include: {
                        units: { take: 2 }
                    }
                }
            }
        });
        if (courseWithContent) {
            const unitCount = courseWithContent.sections.reduce((sum, s) => sum + s.units.length, 0);
            console.log(`   ✅ Course "${courseWithContent.title}" has ${courseWithContent.sections.length} sections, ${unitCount} units`);
        } else {
            console.log('   ⚠️ No courses found to test relations');
        }

        // Test 5: Verify Tenant → Levels relation (newly added)
        console.log('\n5. Testing Tenant → Levels relation (newly added)...');
        const tenantWithLevels = await prisma.tenant.findFirst({
            include: {
                levels: { take: 5 }
            }
        });
        if (tenantWithLevels) {
            console.log(`   ✅ Tenant "${tenantWithLevels.name}" has ${tenantWithLevels.levels.length} levels`);
        } else {
            console.log('   ⚠️ No tenants found');
        }

        // Test 6: Verify Enrollment → User relation (newly added)
        console.log('\n6. Testing Enrollment → User relation (newly added)...');
        const enrollmentWithUser = await prisma.enrollment.findFirst({
            include: {
                user: true,
                course: true,
            }
        });
        if (enrollmentWithUser) {
            console.log(`   ✅ Enrollment links user "${enrollmentWithUser.user.email}" to course "${enrollmentWithUser.course.title}"`);
        } else {
            console.log('   ⚠️ No enrollments found');
        }

        // Test 7: Test RBAC tables
        console.log('\n7. Testing RBAC tables...');
        const rolesWithPermissions = await prisma.authRole.findMany({
            include: {
                rolePermissions: {
                    include: { permission: true }
                }
            }
        });
        rolesWithPermissions.forEach(role => {
            console.log(`   Role "${role.name}": ${role.rolePermissions.length} permissions`);
        });

        // Test 8: Write test (transaction rollback)
        console.log('\n8. Testing write capability (with rollback)...');
        try {
            await prisma.$transaction(async (tx) => {
                const testTenant = await tx.tenant.create({
                    data: {
                        domain: 'test-' + Date.now() + '.example.com',
                        name: 'DB Test Tenant',
                        settings: {},
                    }
                });
                console.log('   ✅ Write test passed (created temp tenant)');
                // Rollback by throwing
                throw new Error('ROLLBACK');
            });
        } catch (e: any) {
            if (e.message === 'ROLLBACK') {
                console.log('   ✅ Transaction rollback successful');
            } else {
                throw e;
            }
        }

        console.log('\n' + '─'.repeat(50));
        console.log('✅ ALL DATABASE TESTS PASSED\n');

    } catch (error) {
        console.error('\n❌ DATABASE TEST FAILED:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();
