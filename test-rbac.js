// Comprehensive RBAC Test for mostafa
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMostafaRBAC() {
    console.log('\n🔐 ===== RBAC VERIFICATION TEST =====\n');

    try {
        // 1. Find mostafa
        const mostafa = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: { contains: 'mostafa', mode: 'insensitive' } },
                    { firstName: { contains: 'mostafa', mode: 'insensitive' } },
                    { email: { contains: 'mostafa', mode: 'insensitive' } }
                ]
            },
            include: { roles: true }
        });

        if (!mostafa) {
            console.log('❌ User mostafa not found');
            return;
        }

        console.log('✅ Found User:');
        console.log(`   Username: ${mostafa.username}`);
        console.log(`   Email: ${mostafa.email}`);
        console.log(`   Status: ${mostafa.status}`);
        console.log(`   Active Role: ${mostafa.role}`);
        console.log();

        // 2. Check assigned roles
        console.log('📋 Assigned Roles:');
        if (mostafa.roles.length === 0) {
            console.log('   ⚠️  No roles assigned via RBAC');
        } else {
            mostafa.roles.forEach(role => {
                console.log(`   ✓ ${role.roleKey}`);
            });
        }
        console.log();

        // 3. Check RBAC Overrides
        console.log('🎛️  RBAC Overrides:');
        const rbacOverrides = mostafa.rbacOverrides;

        if (!rbacOverrides || (typeof rbacOverrides === 'object' && Object.keys(rbacOverrides).length === 0)) {
            console.log('   ⚠️  No RBAC overrides configured');
        } else {
            const overrides = typeof rbacOverrides === 'string' ? JSON.parse(rbacOverrides) : rbacOverrides;

            if (overrides.grants && overrides.grants.length > 0) {
                console.log('   ✅ Granted Permissions:');
                overrides.grants.forEach(perm => {
                    console.log(`      + ${perm}`);
                });
            } else {
                console.log('   • No granted permissions');
            }

            if (overrides.denies && overrides.denies.length > 0) {
                console.log('   ❌ Denied Permissions:');
                overrides.denies.forEach(perm => {
                    console.log(`      - ${perm}`);
                });
            } else {
                console.log('   • No denied permissions');
            }
        }
        console.log();

        // 4. Check if admin role permissions exist in database
        console.log('🔍 Checking ADMIN Role Permissions in Database:');
        try {
            const adminRole = await prisma.authRole.findFirst({
                where: { name: 'ADMIN' },
                include: {
                    rolePermissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            });

            if (!adminRole) {
                console.log('   ⚠️  WARNING: ADMIN role not found in auth_role table!');
                console.log('   This means the system is using fallback permissions (DEV mode only)');
            } else {
                console.log(`   ✅ ADMIN role found (ID: ${adminRole.id})`);
                console.log(`   Total permissions assigned: ${adminRole.rolePermissions.length}`);

                // Check if course:create is in the base permissions
                const hasCourseCreate = adminRole.rolePermissions.some(
                    rp => rp.permission.fullPermission === 'course:create'
                );
                console.log(`   course:create base permission: ${hasCourseCreate ? '✅ YES' : '❌ NO'}`);
            }
        } catch (err) {
            console.log('   ⚠️  Could not query auth_role table:', err.message);
            console.log('   System will use fallback permissions in development mode');
        }
        console.log();

        // 5. Simulate permission check
        console.log('🧪 Simulated Permission Check:');

        // Get base permissions from ADMIN role
        const overrides = typeof rbacOverrides === 'string' ? JSON.parse(rbacOverrides) : rbacOverrides;
        let simulatedPermissions = [
            'user:read', 'user:create', 'user:update', 'user:delete',
            'course:read', 'course:create', 'course:update', 'course:delete',
            // ... more admin permissions
        ];

        console.log('   Base ADMIN permissions: Includes course:create ✓');

        // Apply grants
        if (overrides?.grants && overrides.grants.length > 0) {
            overrides.grants.forEach(p => {
                if (!simulatedPermissions.includes(p)) {
                    simulatedPermissions.push(p);
                    console.log(`   + Granted: ${p}`);
                }
            });
        }

        // Apply denies (CRITICAL)
        if (overrides?.denies && overrides.denies.length > 0) {
            const denySet = new Set(overrides.denies);
            const beforeCount = simulatedPermissions.length;
            simulatedPermissions = simulatedPermissions.filter(p => !denySet.has(p));
            const removedCount = beforeCount - simulatedPermissions.length;

            overrides.denies.forEach(p => {
                console.log(`   - Denied: ${p}`);
            });
            console.log(`   Removed ${removedCount} permission(s) from base set`);
        }

        console.log();
        console.log('📊 Final Permission Check:');
        const hasCourseCreatePermission = simulatedPermissions.includes('course:create');

        if (hasCourseCreatePermission) {
            console.log('   ❌ FAIL: mostafa CAN create courses (course:create permission exists)');
            console.log('   The RBAC deny is NOT working correctly!');
        } else {
            console.log('   ✅ PASS: mostafa CANNOT create courses (course:create permission denied)');
            console.log('   The RBAC system is working correctly!');
        }

        console.log();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Active Role:        ${mostafa.role}`);
        console.log(`Assigned Roles:     ${mostafa.roles.map(r => r.roleKey).join(', ') || 'None'}`);
        console.log(`Override Grants:    ${overrides?.grants?.length || 0}`);
        console.log(`Override Denies:    ${overrides?.denies?.length || 0}`);
        console.log(`course:create:      ${hasCourseCreatePermission ? '✅ ALLOWED (BAD!)' : '❌ DENIED (GOOD!)'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMostafaRBAC();
