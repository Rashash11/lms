
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-lms-skip-rate-limit': '1'
        },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        console.error('Login failed:', await res.text());
        return null;
    }
    return res.headers.getSetCookie().join('; ');
}

async function main() {
    console.log('Starting debug test...');

    // 1. Setup Data
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@portal.com' } });
    if (!adminUser) throw new Error('Admin not found');
    const tenantId = adminUser.tenantId;

    const roles = await prisma.authRole.findMany();
    const instructorRole = roles.find(r => r.name === 'INSTRUCTOR');

    // Create Nodes
    const testNode = await prisma.branch.create({
        data: { name: 'Node A', slug: `node-a-${Date.now()}`, tenantId, isActive: true }
    });
    const otherNode = await prisma.branch.create({
        data: { name: 'Node B', slug: `node-b-${Date.now()}`, tenantId, isActive: true }
    });

    // Create User linked to Node A
    const userEmail = `debug-${Date.now()}@test.com`;
    const userPass = 'User123!Password';

    // Login as Admin to create user
    const adminCookies = await login('admin@portal.com', 'Admin123!');
    if (!adminCookies) throw new Error('Admin login failed');

    const createRes = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookies },
        body: JSON.stringify({
            firstName: 'Debug', lastName: 'User', email: userEmail,
            username: `debug_${Date.now()}`, password: userPass,
            roleIds: [instructorRole?.id],
            nodeId: testNode.id,
            tenantId
        }),
    });

    if (!createRes.ok) {
        console.error('User creation failed:', await createRes.text());
        return;
    }
    console.log('User created');

    // 2. Login as User
    const userCookies = await login(userEmail, userPass);
    if (!userCookies) throw new Error('User login failed');
    console.log('User logged in');

    // 3. Try to switch to Node B (should fail 403)
    console.log(`Attempting to switch to Node B (${otherNode.id})...`);
    const switchRes = await fetch(`${BASE_URL}/api/auth/switch-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': userCookies },
        body: JSON.stringify({ nodeId: otherNode.id }),
    });

    console.log(`Switch Node Status: ${switchRes.status}`);
    const bodyText = await switchRes.text();
    console.log(`Switch Node Body: ${bodyText}`);

    const body = bodyText ? JSON.parse(bodyText) : {};
    console.log(`Expected: 403, Got: ${switchRes.status}, Success: ${switchRes.status === 403 ? 'YES' : 'NO'}`);

    // Cleanup - Skipped for debugging stability
    // await prisma.branch.deleteMany({ where: { id: { in: [testNode.id, otherNode.id] } } });
    // await prisma.user.delete({ where: { email: userEmail } }); 
}

main().catch(e => {
    console.error('Script Error:', e);
    // Print full error details if available
    if (e.response) {
        console.error('Response Data:', e.response.data);
    }
});
