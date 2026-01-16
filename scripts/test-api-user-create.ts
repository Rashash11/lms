
import { sign } from 'jsonwebtoken';

async function testUserCreate() {
    const JWT_SECRET = 'your-secret-key-change-in-production';

    // Seed admin user from seed.json
    const adminId = '00000000-0000-0000-0000-000000000001';
    const tenantId = '00000000-0000-0000-0000-000000000000';

    const token = sign(
        {
            userId: adminId,
            tenantId: tenantId,
            role: 'ADMIN',
            email: 'admin-a@test.local'
        },
        JWT_SECRET
    );

    const payload = {
        firstName: 'API',
        lastName: 'Test',
        email: `api-test-${Date.now()}@example.com`,
        username: `apitest${Date.now()}`,
        password: 'TestPass123!',
        activeRole: 'LEARNER'
    };

    try {
        const res = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Cookie': `session=${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('SUCCESS:', res.status, data);
    } catch (err: any) {
        console.error('FAILED:', err);
    }
}

testUserCreate();
