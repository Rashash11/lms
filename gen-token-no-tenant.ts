import { signAccessToken } from './src/lib/auth-definitions';
import * as fs from 'fs';

async function testApi() {
    // Simulate token WITHOUT tenantId
    const payload = {
        userId: '9de50a5f-39f7-4cfd-ba3c-2d16956d7867',
        email: 'admin@portal.com',
        activeRole: 'ADMIN' as any,
        // No tenantId here
        tokenVersion: 0
    };

    const token = await signAccessToken(payload);
    fs.writeFileSync('token-no-tenant.txt', token);
    console.log('Token (no tenantId) written to token-no-tenant.txt');
}

testApi().catch(console.error);
