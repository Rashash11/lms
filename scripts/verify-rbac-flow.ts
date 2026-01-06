import { PrismaClient } from '@prisma/client';
import { getUserPermissions } from '../src/lib/permissions';

const prisma = new PrismaClient();

async function testUserRBACFlow() {
    console.log("🚀 Starting RBAC User Flow Verification...");

    try {
        // 1. Setup Test Role & Permissions
        const testPerm = await prisma.auth_permission.upsert({
            where: { name: "test:secret_access" },
            update: {},
            create: { name: "test:secret_access", fullPermission: "test:secret_access" }
        });

        const testRole = await prisma.auth_role.upsert({
            where: { name: "SECRET_AGENT" },
            update: {},
            create: { name: "SECRET_AGENT", description: "Test role" }
        });

        await prisma.auth_role_permission.upsert({
            where: { roleId_permissionId: { roleId: testRole.id, permissionId: testPerm.id } },
            update: {},
            create: { roleId: testRole.id, permissionId: testPerm.id }
        });

        // 2. Create Test User with Node-Scoped Role
        const nodeId = 1;
        const testUser = await prisma.user.upsert({
            where: { email: "rbac-test@example.com" },
            update: {},
            create: {
                username: "rbactest",
                email: "rbac-test@example.com",
                firstName: "RBAC",
                lastName: "Test",
                passwordHash: "dummy",
                status: "ACTIVE",
                activeRole: "LEARNER"
            }
        });

        // Cleanup
        await prisma.auth_user_role.deleteMany({ where: { userId: testUser.id } });
        await prisma.user_permission_grant.deleteMany({ where: { userId: testUser.id } });
        await prisma.user_permission_deny.deleteMany({ where: { userId: testUser.id } });

        // Assign Role to Node 1
        await prisma.auth_user_role.create({
            data: { userId: testUser.id, roleId: testRole.id, nodeId: nodeId }
        });

        console.log("✅ User created and assigned node-scoped role.");

        // 3. Verify Scoping
        const permsNode1 = await getUserPermissions(testUser.id, nodeId);
        const permsNode2 = await getUserPermissions(testUser.id, 2);

        console.log(`Node 1 Perms: ${permsNode1.join(", ")}`);
        console.log(`Node 2 Perms: ${permsNode2.join(", ")}`);

        if (permsNode1.includes("test:secret_access") && !permsNode2.includes("test:secret_access")) {
            console.log("✅ Node-scoping working correctly!");
        } else {
            console.error("❌ Node-scoping FAILED!");
        }

        // 4. Test Overrides (Deny wins)
        await prisma.user_permission_deny.create({
            data: { userId: testUser.id, permissionId: testPerm.id, nodeId: nodeId }
        });

        const permsAfterDeny = await getUserPermissions(testUser.id, nodeId);
        if (!permsAfterDeny.includes("test:secret_access")) {
            console.log("✅ Deny override working correctly!");
        } else {
            console.error("❌ Deny override FAILED!");
        }

        // 5. Test Grant independently
        await prisma.user_permission_grant.create({
            data: { userId: testUser.id, permissionId: testPerm.id, nodeId: 2 }
        });
        const permsNode2AfterGrant = await getUserPermissions(testUser.id, 2);
        if (permsNode2AfterGrant.includes("test:secret_access")) {
            console.log("✅ Grant override working correctly!");
        } else {
            console.error("❌ Grant override FAILED!");
        }

        console.log("\n✨ Verification Complete!");
    } catch (err) {
        console.error("❌ Verification error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

testUserRBACFlow();
