import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: { key: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const key = params.key;

        // Fetch all courses and match enrollmentKey in settings
        // This is a safe fallback for all database types including SQLite
        const courses = await prisma.course.findMany();
        const course = courses.find(c => {
            const settings = c.settings as any;
            return settings?.enrollmentKey === key;
        });

        if (!course) {
            return NextResponse.json({ error: "Invalid enrollment link" }, { status: 404 });
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
            return NextResponse.json({
                success: true,
                message: "Already enrolled",
                courseId: course.id
            });
        }

        // Create enrollment
        await prisma.enrollment.create({
            data: {
                userId: session.userId,
                courseId: course.id,
                status: 'NOT_STARTED',
            }
        });

        return NextResponse.json({
            success: true,
            message: "Successfully enrolled!",
            courseId: course.id
        });
    } catch (error) {
        console.error("Enrollment error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
