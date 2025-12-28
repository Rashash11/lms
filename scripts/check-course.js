const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificCourse() {
    console.log('🔍 Checking course: 1b80e066-ca92-4ea3-b403-d10b51b9f9d5\n');

    try {
        const courseId = '1b80e066-ca92-4ea3-b403-d10b51b9f9d5';

        // Get course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                sections: {
                    include: {
                        units: true
                    }
                }
            }
        });

        if (!course) {
            console.log('❌ Course not found');
            return;
        }

        console.log(`✅ Course: ${course.title || course.code}`);
        console.log(`   Status: ${course.status}`);
        console.log(`   Sections: ${course.sections.length}\n`);

        // Get all units for this course
        const units = await prisma.courseUnit.findMany({
            where: { courseId: courseId },
            orderBy: { order_index: 'asc' }
        });

        console.log(`📚 Total units: ${units.length}\n`);

        units.forEach((unit, idx) => {
            console.log(`${idx + 1}. ${unit.title} (${unit.type})`);
            console.log(`   Unit ID: ${unit.id}`);
            console.log(`   Status: ${unit.status}`);
            console.log(`   Config: ${JSON.stringify(unit.config, null, 2)}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificCourse();
