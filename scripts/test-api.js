const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPI() {
    console.log('🧪 Testing Course Content API...\n');

    try {
        // Get learner and first enrollment
        const learner = await prisma.user.findUnique({
            where: { email: 'learner1@portal.com' }
        });

        if (!learner) {
            console.log('❌ Learner not found');
            return;
        }

        console.log(`✅ Learner ID: ${learner.id}`);

        const enrollment = await prisma.enrollment.findFirst({
            where: { userId: learner.id },
            include: { course: true }
        });

        if (!enrollment) {
            console.log('❌ No enrollment found');
            return;
        }

        console.log(`✅ Enrolled in: ${enrollment.course.title}`);
        console.log(`   Course ID: ${enrollment.courseId}\n`);

        // Get course units
        const units = await prisma.courseUnit.findMany({
            where: { courseId: enrollment.courseId },
            orderBy: { order_index: 'asc' },
            take: 3
        });

        console.log(`📚 Found ${units.length} units in this course:\n`);

        units.forEach((unit, idx) => {
            console.log(`${idx + 1}. ${unit.title} (${unit.type})`);
            console.log(`   Unit ID: ${unit.id}`);
            console.log(`   Section ID: ${unit.sectionId || 'unassigned'}`);
            console.log(`   Config: ${JSON.stringify(unit.config, null, 2)}`);
            console.log('');
        });

        // Test what the frontend should see
        console.log('🔍 What the UnitRenderer will receive:');
        const testUnit = units[0];
        if (testUnit) {
            console.log(`   Type: ${testUnit.type}`);
            console.log(`   Content field: ${testUnit.config?.content || 'NOT FOUND'}`);
            console.log(`   Text field: ${testUnit.config?.text || 'NOT FOUND'}`);
            console.log(`   Body field: ${testUnit.config?.body || 'NOT FOUND'}`);
            console.log(`   URL field: ${testUnit.config?.url || 'NOT FOUND'}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAPI();
