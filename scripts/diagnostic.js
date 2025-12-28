const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runDiagnostic() {
    console.log('🔍 Running LMS Content Diagnostic...\n');

    try {
        // 1. Check courses
        const courses = await prisma.course.findMany({
            where: { status: 'PUBLISHED' }
        });
        console.log(`✅ Found ${courses.length} published courses`);
        courses.forEach(c => console.log(`   - ${c.code}: ${c.title}`));

        // 2. Check course sections
        const sections = await prisma.courseSection.findMany({
            include: {
                _count: {
                    select: { units: true }
                }
            }
        });
        console.log(`\n✅ Found ${sections.length} sections`);
        sections.forEach(s => console.log(`   - ${s.title}: ${s._count.units} units`));

        // 3. Check course units
        const units = await prisma.courseUnit.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log(`\n✅ Found ${await prisma.courseUnit.count()} total units`);
        console.log('📄 Sample units:');
        units.forEach(u => {
            const hasContent = u.config && Object.keys(u.config).length > 0;
            const contentPreview = hasContent ? JSON.stringify(u.config).substring(0, 80) + '...' : 'EMPTY';
            console.log(`   - ${u.type}: ${u.title}`);
            console.log(`     Config: ${contentPreview}`);
        });

        // 4. Check enrollments
        const enrollments = await prisma.enrollment.findMany({
            include: {
                course: {
                    select: { code: true, title: true }
                }
            },
            take: 5
        });
        console.log(`\n✅ Found ${await prisma.enrollment.count()} enrollments`);
        enrollments.forEach(e => console.log(`   - User: ${e.userId.substring(0, 8)}... → ${e.course.code}`));

        // 5. Check learner user
        const learner = await prisma.user.findUnique({
            where: { email: 'learner1@portal.com' },
            select: { id: true, email: true, firstName: true }
        });

        if (learner) {
            console.log(`\n✅ Learner found: ${learner.firstName} (${learner.email})`);
            console.log(`   ID: ${learner.id}`);

            // Get first enrolled course for this learner
            const enrollment = await prisma.enrollment.findFirst({
                where: { userId: learner.id },
                include: {
                    course: {
                        include: {
                            sections: {
                                include: {
                                    units: {
                                        take: 1
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (enrollment) {
                console.log(`\n📚 First enrolled course: ${enrollment.course.title}`);
                console.log(`   Sections: ${enrollment.course.sections.length}`);

                if (enrollment.course.sections.length > 0) {
                    const firstSection = enrollment.course.sections[0];
                    const firstUnit = firstSection.units[0];

                    if (firstUnit) {
                        console.log(`\n📝 First unit details:`);
                        console.log(`   Title: ${firstUnit.title}`);
                        console.log(`   Type: ${firstUnit.type}`);
                        console.log(`   Config keys: ${Object.keys(firstUnit.config || {}).join(', ')}`);
                        console.log(`   Config data: ${JSON.stringify(firstUnit.config, null, 2)}`);
                    }
                }
            }
        } else {
            console.log('\n❌ Learner not found');
        }

        console.log('\n✅ Diagnostic complete!\n');

    } catch (error) {
        console.error('❌ Diagnostic error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runDiagnostic();
