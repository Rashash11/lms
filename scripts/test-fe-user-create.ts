
import { SignJWT } from 'jose';

async function testUserCreateExact() {
    const JWT_SECRET = 'your-secret-key-change-in-production';
    const adminId = '00000000-0000-0000-0000-000000000001';
    const tenantId = '00000000-0000-0000-0000-000000000000';

    const token = await new SignJWT({
        userId: adminId,
        tenantId: tenantId,
        role: 'ADMIN',
        email: 'admin-a@test.local'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(Buffer.from(JWT_SECRET));

    const payload = {
        firstName: 'Frontend',
        lastName: 'Test',
        email: `fe-test-${Date.now()}@test.local`,
        username: `fetest${Date.now()}`,
        password: 'TestPass123!',
        status: 'ACTIVE',
        activeRole: 'LEARNER',
        timezone: 'Europe/London',
        language: 'en'
    };

    try {
        const res = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Cookie': `session=${token}`,
                'Content-Type': 'application/json',
                'x-csrf-token': 'dummy' // Might fail if verified, but withGuard uses cookie too
            },
            body: JSON.stringify(payload)
        });
        console.log('Result:', res.status, await res.json());
    } catch (err: any) {
        console.error('Error:', err);
    }
}

testUserCreateExact();
