export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthCheck {
    name: string;
    status: "ok" | "fail";
    message?: string;
}

/**
 * GET /api/health
 * Public health check endpoint - no auth required
 */
export async function GET() {
    const checks: HealthCheck[] = [];
    let allPassed = true;

    // 1. Check required environment variables
    const requiredEnvVars = ["JWT_SECRET"];
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (!value || value === "default_secret_key_change_me") {
            checks.push({
                name: `env:${envVar}`,
                status: "fail",
                message: value ? "Using default value (insecure)" : "Missing",
            });
            allPassed = false;
        } else {
            checks.push({ name: `env:${envVar}`, status: "ok" });
        }
    }

    // 2. Check database connectivity
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.push({ name: "db:connection", status: "ok" });
    } catch {
        checks.push({
            name: "db:connection",
            status: "fail",
            message: "Cannot connect to database",
        });
        allPassed = false;
    }

    // 3. Check RBAC tables exist
    try {
        const [roleCount, permCount, mappingCount] = await Promise.all([
            prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::bigint as count FROM auth_role`,
            prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::bigint as count FROM auth_permission`,
            prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::bigint as count FROM auth_role_permission`,
        ]);

        const roles = Number(roleCount[0]?.count || 0);
        const perms = Number(permCount[0]?.count || 0);
        const mappings = Number(mappingCount[0]?.count || 0);

        if (roles > 0 && perms > 0 && mappings > 0) {
            checks.push({
                name: "rbac:tables",
                status: "ok",
                message: `roles=${roles}, perms=${perms}`,
            });
        } else {
            checks.push({
                name: "rbac:tables",
                status: "fail",
                message: `Empty: roles=${roles}, perms=${perms}`,
            });
            allPassed = false;
        }
    } catch {
        checks.push({
            name: "rbac:tables",
            status: "fail",
            message: "RBAC tables not accessible",
        });
        allPassed = false;
    }

    return NextResponse.json({
        status: allPassed ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        checks,
    }, { status: allPassed ? 200 : 500 });
}
