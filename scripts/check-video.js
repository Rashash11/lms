const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVideoUnit() {
    const courseId = '1b80e066-ca92-4ea3-b403-d10b51b9f9d5';

    try {
        const videoUnit = await prisma.courseUnit.findFirst({
            where: {
                courseId: courseId,
                type: 'VIDEO'
            }
        });

        if (videoUnit) {
            console.log('Video Unit Config:');
            console.log(JSON.stringify(videoUnit.config, null, 2));
        } else {
            console.log('No video unit found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkVideoUnit();
