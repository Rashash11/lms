import { signAccessToken } from './src/lib/auth-definitions';
import * as fs from 'fs';

async function testApi() {
    const payload = {
        userId: '9de50a5f-39f7-4cfd-ba3c-2d16956d7867',
        email: 'admin@portal.com',
        activeRole: 'ADMIN' as any,
        tenantId: '0d7b24a1-c638-4112-b028-7e207a326647',
        tokenVersion: 0
    };

    const token = await signAccessToken(payload);
    fs.writeFileSync('token.txt', token);
    console.log('Token written to token.txt');
}

testApi().catch(console.error);
