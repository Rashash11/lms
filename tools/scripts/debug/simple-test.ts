
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    console.log('Connecting...');
    try {
        const user = await prisma.user.findFirst({
            where: { email: 'admin@portal.com' }
        });
        console.log('User:', user);
    } catch (e) {
        console.error('Error:', e);
    }
}
main()
