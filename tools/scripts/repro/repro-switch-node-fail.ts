import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function login(email: string, password: string): Promise<string | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return null;
        const setCookies = res.headers.getSetCookie();
        return setCookies.map(cookie => cookie.split(';')[0]).join('; ');
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('Reproducing switch-node failure...');

    try {
        // 1. Get a user
        const user = await prisma.user.findFirst({
            where: { email: 'instructor@portal.com' },
            include: { tenant: true }
        });
        if (!user) { console.error('User not found'); return; }

        const cookies = await login('instructor@portal.com', 'Instructor123!');
        if (!cookies) { console.error('Login failed'); return; }

        // 2. Create another branch they are NOT assigned to
        const otherBranch = await prisma.branch.create({
            data: {
                name: 'Forbidden Branch',
                slug: `forbidden-${Date.now()}`,
                tenantId: user.tenantId,
                isActive: true
            }
        });
        console.log(`Created Forbidden Branch: ${otherBranch.id}`);

        // 3. Try to switch to it
        console.log('Attempting to switch to forbidden branch...');
        const res = await fetch(`${BASE_URL}/api/auth/switch-node`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
            body: JSON.stringify({ nodeId: otherBranch.id }),
        });

        console.log(`Status: ${res.status}`);
        const body = await res.json().catch(() => ({}));
        console.log('Body:', JSON.stringify(body, null, 2));

        if (res.status === 500) {
            fs.writeFileSync('switch_node_error_body.json', JSON.stringify(body, null, 2));
        }

        // Cleanup
        await prisma.branch.delete({ where: { id: otherBranch.id } });
    } catch (error: any) {
        fs.writeFileSync('switch_node_error_full.txt', error.message + '\n' + error.stack);
        console.error('CAUGHT ERROR', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
