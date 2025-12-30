import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt, RoleKey } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define public routes (no auth required)
    const isPublicRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/api/auth') ||
        pathname === '/' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/files') ||
        pathname.includes('.');

    // Disabled routes (Candidate, SuperAdmin - not TalentLMS)
    const isDisabledRoute =
        pathname.startsWith('/candidate') ||
        pathname.startsWith('/superadmin');

    if (isDisabledRoute) {
        // Redirect disabled routes to admin (or login if not authenticated)
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Skip auth for public routes
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Get session from cookie
    const sessionCookie = request.cookies.get('session')?.value ?? '';
    let session: { activeRole: RoleKey; userId: string } | null = null;

    if (sessionCookie.length > 0) {
        try {
            session = (await decrypt(sessionCookie)) as { activeRole: RoleKey; userId: string };
        } catch (e) {
            // Invalid session - will redirect to login
        }
    }

    // Check if user is authenticated
    if (session === null) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    } else {
        const activeRole = session!.activeRole;

        // Role-based route protection
        const isAdminRoute = pathname.startsWith('/admin');
        const isSuperInstructorRoute = pathname.startsWith('/super-instructor');
        const isInstructorRoute = pathname.startsWith('/instructor');
        const isLearnerRoute = pathname.startsWith('/learner');

        // Super Instructor routes - only SUPER_INSTRUCTOR role
        if (isSuperInstructorRoute && activeRole !== 'SUPER_INSTRUCTOR') {
            if (activeRole === 'ADMIN') {
                return NextResponse.redirect(new URL('/admin', request.url));
            } else if (activeRole === 'INSTRUCTOR') {
                return NextResponse.redirect(new URL('/instructor', request.url));
            }
            return NextResponse.redirect(new URL('/learner', request.url));
        }

        // Admin routes - only ADMIN role (not SUPER_INSTRUCTOR anymore)
        if (isAdminRoute && activeRole !== 'ADMIN') {
            if (activeRole === 'SUPER_INSTRUCTOR') {
                return NextResponse.redirect(new URL('/super-instructor', request.url));
            } else if (activeRole === 'INSTRUCTOR') {
                return NextResponse.redirect(new URL('/instructor', request.url));
            }
            return NextResponse.redirect(new URL('/learner', request.url));
        }

        // Instructor routes - ADMIN, SUPER_INSTRUCTOR or INSTRUCTOR
        if (isInstructorRoute && !['ADMIN', 'SUPER_INSTRUCTOR', 'INSTRUCTOR'].includes(activeRole)) {
            return NextResponse.redirect(new URL('/learner', request.url));
        }

        // Learner routes - any authenticated user can access
        // (all roles can view learner experience)

        // Continue with the request
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes that handle their own auth
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|mp4|webm|pdf)$).*)',
    ],
}
