const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const course = await prisma.course.findFirst({
        select: { id: true, title: true }
    });
    if (course) {
        console.log(`FOUND_COURSE_ID: ${course.id}`);
        console.log(`FOUND_COURSE_TITLE: ${course.title}`);
    } else {
        console.log("NO_COURSES_FOUND");
    }
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
