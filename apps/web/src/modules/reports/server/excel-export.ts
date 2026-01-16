import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';

/**
 * Generate Training Progress Excel file with 5 sheets matching TalentLMS format
 */
export async function generateTrainingProgressExcel(domain: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    // Get data
    const [
        activeUsersCount,
        assignedCoursesCount,
        completedCoursesCount,
        users,
        courses,
        enrollments,
        timelineEvents,
    ] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { not: null }, status: 'ACTIVE' } }),
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
        prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                lastLoginAt: true,
            },
        }),
        prisma.course.findMany({
            select: {
                id: true,
                title: true,
                code: true,
            },
        }),
        prisma.enrollment.findMany({
            select: {
                userId: true,
                courseId: true,
                progress: true,
                status: true,
            },
        }),
        prisma.timelineEvent.findMany({
            take: 1000,
            orderBy: { timestamp: 'desc' },
        }),
    ]);

    // Calculate 30-day stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const loggedInUsers = await prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } },
    });

    const recentEnrollments = await prisma.enrollment.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const recentCompletions = await prisma.enrollment.count({
        where: { completedAt: { gte: thirtyDaysAgo, not: null } },
    });

    // Sheet 1: Overview
    const overviewSheet = workbook.addWorksheet('Overview');
    const exportDate = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    overviewSheet.addRow(['Report information']);
    overviewSheet.addRow(['Domain', domain]);
    overviewSheet.addRow(['Report type', 'Training progress']);
    overviewSheet.addRow(['Export date', exportDate]);
    overviewSheet.addRow([]);
    overviewSheet.addRow(['Training activity']);
    overviewSheet.addRow(['Active users', activeUsersCount]);
    overviewSheet.addRow(['Assigned courses', assignedCoursesCount]);
    overviewSheet.addRow(['Completed courses', completedCoursesCount]);
    overviewSheet.addRow([]);
    overviewSheet.addRow(['Last 30 days activity']);
    overviewSheet.addRow(['New users', newUsers]);
    overviewSheet.addRow(['Logged in users', loggedInUsers]);
    overviewSheet.addRow(['Logins', loggedInUsers]); // Approximate
    overviewSheet.addRow(['Assigned courses', recentEnrollments]);
    overviewSheet.addRow(['Completed courses', recentCompletions]);

    // Make first column bold
    overviewSheet.getColumn(1).font = { bold: true };

    // Sheet 2: Training progress
    const trainingSheet = workbook.addWorksheet('Training progress');
    trainingSheet.addRow(['User', 'Email', 'Course', 'Progress', 'Status']);

    users.forEach((user) => {
        const userEnrollments = enrollments.filter((e) => e.userId === user.id);
        userEnrollments.forEach((enrollment) => {
            const course = courses.find((c) => c.id === enrollment.courseId);
            trainingSheet.addRow([
                `${user.firstName} ${user.lastName}`,
                user.email,
                course?.title || '',
                `${enrollment.progress}%`,
                enrollment.status,
            ]);
        });
    });

    // Sheet 3: Courses
    const coursesSheet = workbook.addWorksheet('Courses');
    coursesSheet.addRow(['Course', 'Code', 'Assigned users', 'Completed users', 'Completion rate']);

    courses.forEach((course) => {
        const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
        const assignedCount = courseEnrollments.length;
        const completedCount = courseEnrollments.filter((e) => e.status === 'COMPLETED').length;
        const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

        coursesSheet.addRow([
            course.title,
            course.code,
            assignedCount,
            completedCount,
            `${completionRate}%`,
        ]);
    });

    // Sheet 4: Users
    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.addRow(['Name', 'Email', 'Last login', 'Assigned courses', 'Completed courses']);

    users.forEach((user) => {
        const userEnrollments = enrollments.filter((e) => e.userId === user.id);
        const completedCount = userEnrollments.filter((e) => e.status === 'COMPLETED').length;
        const lastLogin = user.lastLoginAt
            ? user.lastLoginAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Never';

        usersSheet.addRow([
            `${user.firstName} ${user.lastName}`,
            user.email,
            lastLogin,
            userEnrollments.length,
            completedCount,
        ]);
    });

    // Sheet 5: Timeline
    const timelineSheet = workbook.addWorksheet('Timeline');
    timelineSheet.addRow(['Date', 'Event type', 'User', 'Course', 'Description']);

    timelineEvents.forEach((event) => {
        const eventDate = event.timestamp.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });

        const user = users.find((u) => u.id === event.userId);
        const course = courses.find((c) => c.id === event.courseId);
        const details = event.details as any;

        timelineSheet.addRow([
            eventDate,
            event.eventType,
            user ? `${user.firstName} ${user.lastName}` : '',
            course?.title || '',
            JSON.stringify(details),
        ]);
    });

    return workbook;
}

/**
 * Generate Training Matrix Excel export
 */
export async function generateMatrixExcel(
    users: any[],
    courses: any[]
): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Training Matrix');

    // Header row
    const headerRow = ['User', ...courses.map((c) => c.title)];
    sheet.addRow(headerRow);

    // Data rows
    users.forEach((user) => {
        const row = [
            user.userName,
            ...user.courses.map((c: any) => `${c.progress}%`),
        ];
        sheet.addRow(row);
    });

    return workbook;
}
