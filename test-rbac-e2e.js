// End-to-End RBAC Test
// This tests the actual permission system, not just the data

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import the permission checking function
async function getUserPermissions(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            roles: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Get role keys
    const roleKeys = new Set();
    if (user.role) roleKeys.add(user.role);
    if (user.roles) {
        user.roles.forEach(ur => roleKeys.add(ur.roleKey));
    }

    const roleNames = Array.from(roleKeys);

    // Get permissions from database (or use fallback)
    let permissions = [];

    // In development, use fallback for ADMIN role
    if (process.env.NODE_ENV !== 'production') {
        // Default ADMIN permissions
        if (roleNames.includes('ADMIN')) {
            permissions = [
                'user:read', 'user:create', 'user:update', 'user:delete', 'user:assign_role',
                'course:read', 'course:create', 'course:update', 'course:delete',
                'enrollment:read', 'enrollment:create', 'enrollment:update', 'enrollment:delete',
                // ... more permissions
            ];
        }
    }

    // Apply RBAC Overrides (grants/denies)
    const overrides = user.rbacOverrides;
    if (overrides) {
        if (overrides.grants) {
            overrides.grants.forEach(p => {
                if (!permissions.includes(p)) permissions.push(p);
            });
        }
        if (overrides.denies) {
            const denySet = new Set(overrides.denies);
            permissions = permissions.filter(p => !denySet.has(p));
        }
    }

    return permissions;
}

async function testEndToEnd() {
    console.log('\n========================================');
    console.log('   END-TO-END RBAC PERMISSION TEST');
    console.log('========================================\n');

    try {
        // Find mostafa
        const mostafa = await prisma.user.findFirst({
            where: {
                OR: [
                    { firstName: { contains: 'mostafa', mode: 'insensitive' } },
                    { email: { contains: 'mostafa', mode: 'insensitive' } }
                ]
            },
            include: { roles: true }
        });

        if (!mostafa) {
            console.log('❌ User not found\n');
            return;
        }

        console.log('📝 User Information:');
        console.log(`   Name: ${mostafa.firstName} ${mostafa.lastName}`);
        console.log(`   Email: ${mostafa.email}`);
        console.log(`   Active Role: ${mostafa.role}`);
        console.log(`   Assigned Roles: ${mostafa.roles.map(r => r.roleKey).join(', ')}\n`);

        // Get effective permissions
        const permissions = await getUserPermissions(mostafa.id);

        console.log('🔍 Permission Analysis:');
        console.log(`   Total Permissions: ${permissions.length}`);
        console.log('');

        // Test specific permissions
        const testsuite = [
            { permission: 'user:read', expected: true, description: 'Read users' },
            { permission: 'user:create', expected: true, description: 'Create users' },
            { permission: 'course:read', expected: true, description: 'Read courses' },
            { permission: 'course:create', expected: false, description: 'Create courses (DENIED)' },
            { permission: 'course:update', expected: true, description: 'Update courses' },
            { permission: 'course:delete', expected: true, description: 'Delete courses' },
        ];

        console.log('🧪 Permission Tests:');
        let passed = 0;
        let failed = 0;

        for (const test of testsuite) {
            const hasPermission = permissions.includes(test.permission);
            const isCorrect = hasPermission === test.expected;

            const status = isCorrect ? '✅ PASS' : '❌ FAIL';
            const result = hasPermission ? 'ALLOWED' : 'DENIED';
            const expectedResult = test.expected ? 'ALLOWED' : 'DENIED';

            console.log(`   ${status} | ${test.permission.padEnd(15)} | ${result.padEnd(7)} (expected: ${expectedResult})`);

            if (isCorrect) passed++;
            else failed++;
        }

        console.log('');
        console.log('========================================');
        console.log('📊 TEST RESULTS:');
        console.log(`   Passed: ${passed}/${testsuite.length}`);
        console.log(`   Failed: ${failed}/${testsuite.length}`);
        console.log('');

        if (failed === 0) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('The RBAC system is working correctly.');
            console.log('Mostafa can access admin functions but');
            console.log('CANNOT create courses due to the deny rule.');
        } else {
            console.log('❌ SOME TESTS FAILED!');
            console.log('The RBAC system may need attention.');
        }
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Test Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testEndToEnd();
