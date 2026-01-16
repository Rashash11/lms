/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    // Strangler Pattern: Proxy migrated API routes to Python/FastAPI backend
    // Set PYTHON_BACKEND_URL=http://localhost:8000 in .env to enable
    async rewrites() {
        const localStubs = [
            {
                source: '/@vite/:path*',
                destination: '/api/vite/:path*',
            },
            {
                source: '/@react-refresh',
                destination: '/api/vite/react-refresh',
            },
        ];

        const backendUrl = process.env.PYTHON_BACKEND_URL;
        if (!backendUrl) {
            console.log('[next.config.js] No PYTHON_BACKEND_URL set, using Node.js API routes');
            return localStubs;
        }

        console.log(`[next.config.js] Proxying API routes to FastAPI: ${backendUrl}`);

        return [
            ...localStubs,
            // ===== Routes fully migrated to FastAPI =====
            // These routes are served by the Python backend

            // Courses (includes nested routes)
            {
                source: '/api/courses/:path*',
                destination: `${backendUrl}/api/courses/:path*`,
            },
            // Enrollments
            {
                source: '/api/enrollments/:path*',
                destination: `${backendUrl}/api/enrollments/:path*`,
            },
            {
                source: '/api/enrollments',
                destination: `${backendUrl}/api/enrollments`,
            },
            // Groups
            {
                source: '/api/groups/:path*',
                destination: `${backendUrl}/api/groups/:path*`,
            },
            {
                source: '/api/groups',
                destination: `${backendUrl}/api/groups`,
            },
            // Categories
            {
                source: '/api/categories/:path*',
                destination: `${backendUrl}/api/categories/:path*`,
            },
            {
                source: '/api/categories',
                destination: `${backendUrl}/api/categories`,
            },
            // Branches
            {
                source: '/api/branches/:path*',
                destination: `${backendUrl}/api/branches/:path*`,
            },
            {
                source: '/api/branches',
                destination: `${backendUrl}/api/branches`,
            },
            // Learning Paths
            {
                source: '/api/learning-paths/:path*',
                destination: `${backendUrl}/api/learning-paths/:path*`,
            },
            {
                source: '/api/learning-paths',
                destination: `${backendUrl}/api/learning-paths`,
            },
            // Assignments
            {
                source: '/api/assignments/:path*',
                destination: `${backendUrl}/api/assignments/:path*`,
            },
            {
                source: '/api/assignments',
                destination: `${backendUrl}/api/assignments`,
            },
            // Notifications
            {
                source: '/api/notifications/:path*',
                destination: `${backendUrl}/api/notifications/:path*`,
            },
            {
                source: '/api/notifications',
                destination: `${backendUrl}/api/notifications`,
            },
            // Reports
            {
                source: '/api/reports/:path*',
                destination: `${backendUrl}/api/reports/:path*`,
            },
            {
                source: '/api/reports',
                destination: `${backendUrl}/api/reports`,
            },
            // Users
            {
                source: '/api/users/:path*',
                destination: `${backendUrl}/api/users/:path*`,
            },
            {
                source: '/api/users',
                destination: `${backendUrl}/api/users`,
            },
            // Health check
            {
                source: '/api/health',
                destination: `${backendUrl}/api/health`,
            },

            // ===== Routes still on Node.js (NOT proxied) =====
            // - /api/auth/* (login, logout, refresh - needs cookie handling)
            // - /api/admin/* (complex permissions, needs full migration)
            // - /api/catalog/* (still on Node.js)
        ];
    },
}


module.exports = nextConfig
