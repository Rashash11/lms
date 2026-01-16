import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EnrollmentView from "./EnrollmentView";

export default async function EnrollPage({ params }: { params: { key: string } }) {
    const { key } = params;
    const session = await getSession();

    // Find course
    const courses = await prisma.course.findMany();
    const course = courses.find(c => {
        const settings = c.settings as any;
        return settings?.enrollmentKey === key;
    });

    if (!course) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' }}>
                <h2 style={{ color: '#d32f2f' }}>Invalid or expired enrollment link</h2>
            </div>
        );
    }

    if (!session) {
        redirect(`/login?callbackUrl=/enroll/${key}`);
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: {
                userId: session.userId,
                courseId: course.id
            }
        }
    });

    if (existing) {
        redirect(`/courses/${course.id}`);
    }

    return <EnrollmentView course={{ id: course.id, title: course.title, subtitle: course.subtitle }} enrollmentKey={key} />;
}
