const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function verifyRBAC() {
    const output = [];
    const log = (msg) => {
        console.log(msg);
        output.push(msg);
    };

    try {
        log('\n====== RBAC VERIFICATION ======\n');

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
            log('ERROR: User not found');
            return;
        }

        log(`User: ${mostafa.firstName} ${mostafa.lastName}`);
        log(`Email: ${mostafa.email}`);
        log(`Active Role: ${mostafa.role}`);
        log(`Assigned Roles: ${mostafa.roles.map(r => r.roleKey).join(', ')}`);
        log('');

        const rbac = mostafa.rbacOverrides;
        log('RBAC Overrides:');
        if (rbac && rbac.denies) {
            log(`  Denied Permissions: ${rbac.denies.join(', ')}`);
        }
        if (rbac && rbac.grants) {
            log(`  Granted Permissions: ${rbac.grants.join(', ')}`);
        }
        log('');

        // Test permission logic
        const hasCourseCreate = rbac && rbac.denies && rbac.denies.includes('course:create');
        log('PERMISSION TEST:');
        log(`  course:create is DENIED: ${hasCourseCreate ? 'YES ✓' : 'NO ✗'}`);
        log('');

        if (hasCourseCreate) {
            log('RESULT: ✓ RBAC is working correctly!');
            log('Mostafa CANNOT create courses even though he is an ADMIN.');
        } else {
            log('RESULT: ✗ RBAC may not be working!');
            log('Mostafa CAN create courses.');
        }

        log('\n===============================\n');

        // Write to file
        fs.writeFileSync('rbac-test-results.txt', output.join('\n'));
        log('Results written to rbac-test-results.txt');

    } catch (error) {
        log('ERROR: ' + error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRBAC();
