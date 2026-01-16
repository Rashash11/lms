import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessTokenLight, RoleKey } from '@/lib/auth-definitions'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define public routes (no auth required)
    const isPublicRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/_debug') || // Dev-only debug endpoints
        pathname.startsWith('/dev') || // Dev-only pages
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
    const refreshCookie = request.cookies.get('refreshToken')?.value ?? '';


    let session: { role: RoleKey; userId: string; tokenVersion?: number } | null = null;

    if (sessionCookie.length > 0) {
        try {
            // Use lightweight verification (no DB call) for middleware performance
            const payload = await verifyAccessTokenLight(sessionCookie);
            session = {
                role: payload.activeRole,
                userId: payload.userId,
                tokenVersion: payload.tokenVersion,
            };
        } catch (e) {
            // Invalid or expired session - will check refresh token below
        }
    }

    const accept = request.headers.get('accept') ?? '';
    const isRscRequest =
        accept.includes('text/x-component') ||
        request.headers.get('rsc') === '1' ||
        request.headers.get('next-router-state-tree') !== null ||
        request.nextUrl.searchParams.has('_rsc');

    const isPrefetchRequest =
        request.headers.get('next-router-prefetch') === '1' ||
        request.headers.get('purpose') === 'prefetch';

    // If session is expired but refresh token exists, try to refresh
    if (session === null && refreshCookie.length > 0) {
        // Skip refresh on prefetch and RSC requests to avoid race conditions and aborts
        if (isPrefetchRequest || isRscRequest) {
            return NextResponse.next();
        }

        // Redirect to a special refresh endpoint that will handle the refresh and redirect back
        const refreshUrl = new URL('/api/auth/refresh-and-redirect', request.url);
        refreshUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
        return NextResponse.redirect(refreshUrl);
    }

    // Check if user is authenticated
    if (session === null) {
        if (isPrefetchRequest || isRscRequest) {
            return NextResponse.next();
        }

        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const activeRole = session.role;

    // Role-based route protection
    const isAdminRoute = pathname.startsWith('/admin');
    const isSuperInstructorRoute = pathname.startsWith('/super-instructor');
    const isInstructorRoute = pathname.startsWith('/instructor');

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

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - /api routes (they handle their own auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|@vite|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|mp4|webm|pdf)$).*)',
    ],
}
