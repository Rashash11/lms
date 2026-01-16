import { PrismaClient } from '@prisma/client';

async function reproSwitchNode() {
    const prisma = new PrismaClient();
    const BASE_URL = 'http://localhost:3000';

    // Create other node
    const tenant = await prisma.tenant.findFirst();
    console.log(`Using tenant: ${tenant?.id}`);
    const otherNode = await prisma.branch.create({
        data: {
            name: 'Repro Node',
            slug: `repro-node-${Date.now()}`,
            tenantId: tenant?.id || ''
        }
    });
    console.log(`Created node: ${otherNode.id}`);

    // Login as learner (who is NOT assigned to this node)
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'learner1@portal.com', password: 'Learner123!' })
    });
    const cookies = loginRes.headers.getSetCookie().join('; ');

    // Try to switch to that node
    const res = await fetch(`${BASE_URL}/api/auth/switch-node`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
        },
        body: JSON.stringify({ nodeId: otherNode.id })
    });

    console.log(`Status: ${res.status}`);
    const body = await res.json();
    console.log('Body:', JSON.stringify(body, null, 2));

    if (res.status === 403) {
        console.log('✅ Correct: Switch denied with 403');
    } else if (res.status === 404) {
        console.log('❌ Bug: Node not found (404) even though it was just created');
    }

    // Cleanup
    await prisma.branch.delete({ where: { id: otherNode.id } });
}

reproSwitchNode().catch(console.error);
