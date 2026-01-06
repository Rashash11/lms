export { };
import { prisma } from '../src/lib/prisma';

async function checkPermissions(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                userType: true
            }
        });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return;
        }

        console.log(`\n👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`🎭 Role: ${user.activeRole}`);
        console.log(`📁 UserType: ${user.userType?.name || 'None'}`);

        const permissions = (user.userType?.permissions as string[]) || [];
        console.log(`🔐 DB Permissions: ${permissions.length > 0 ? permissions.join(', ') : 'None'}`);

        if (permissions.length === 0) {
            console.log('ℹ️  This user will fall back to hardcoded role-based permissions.');
        } else {
            console.log('✅ This user uses DB-backed explicit permissions.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: npx tsx scripts/check-permissions.ts <email>');
    process.exit(1);
}

checkPermissions(email);
