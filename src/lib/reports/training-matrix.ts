import { prisma } from '@/lib/prisma';

export interface TrainingMatrixRow {
    userId: string;
    userName: string;
    userEmail: string;
    courses: {
        courseId: string;
        courseName: string;
        progress: number;
        status: string;
    }[];
}

export interface TrainingMatrixFilters {
    search?: string;
    branchId?: string;
    groupId?: string;
}

/**
 * Get training matrix data (users x courses with progress)
 */
export async function getTrainingMatrix(filters?: TrainingMatrixFilters): Promise<{
    users: TrainingMatrixRow[];
    courses: { id: string; title: string }[];
}> {
    const where: any = {};

    if (filters?.search) {
        where.OR = [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    // Get all users
    const users = await prisma.user.findMany({
        where,
        take: 100,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    });

    // Get all courses
    const courses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        select: {
            id: true,
            title: true,
        },
    });

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
        where: {
            userId: { in: users.map((u) => u.id) },
            courseId: { in: courses.map((c) => c.id) },
        },
        select: {
            userId: true,
            courseId: true,
            progress: true,
            status: true,
        },
    });

    // Build matrix
    const matrix: TrainingMatrixRow[] = users.map((user) => {
        const userEnrollments = enrollments.filter((e) => e.userId === user.id);

        return {
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
            courses: courses.map((course) => {
                const enrollment = userEnrollments.find((e) => e.courseId === course.id);
                return {
                    courseId: course.id,
                    courseName: course.title,
                    progress: enrollment?.progress || 0,
                    status: enrollment?.status || 'NOT_STARTED',
                };
            }),
        };
    });

    return {
        users: matrix,
        courses,
    };
}
