const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCourse() {
    const courseId = '1b80e066-ca92-4ea3-b403-d10b51b9f9d5';

    console.log('🔧 Fixing course content...\n');

    try {
        // Get all units for this course
        const units = await prisma.courseUnit.findMany({
            where: { courseId: courseId },
            orderBy: { order_index: 'asc' }
        });

        console.log(`Found ${units.length} units to fix\n`);

        for (const unit of units) {
            console.log(`Fixing: ${unit.title} (${unit.type})`);

            let newConfig = {};

            if (unit.type === 'TEXT') {
                newConfig = {
                    content: `<p>This is sample content for <strong>${unit.title}</strong>.</p><p>You can edit this content through the admin course editor.</p>`
                };
            } else if (unit.type === 'VIDEO') {
                newConfig = {
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    source: 'youtube',
                    content: {
                        type: 'youtube',
                        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                };
            }

            await prisma.courseUnit.update({
                where: { id: unit.id },
                data: { config: newConfig }
            });

            console.log(`  ✅ Updated with sample content\n`);
        }

        console.log('✅ All units updated!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixCourse();
