import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET(req: NextRequest) {
    try {
        const session = await requireAuth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Previewing permissions requires user:create or user:update
        const hasPermission = await can(session, "user:create");
        if (!hasPermission) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const nodeId = searchParams.get("nodeId");
        const roleIds = searchParams.get("roleIds")?.split(",").filter(id => id.length > 0) || [];
        const grantIds = searchParams.get("grantIds")?.split(",").filter(id => id.length > 0) || [];
        const denyIds = searchParams.get("denyIds")?.split(",").filter(id => id.length > 0) || [];

        // Compute effective permissions
        const effectivePermissions = new Set<string>();

        // 1. Permissions from roles
        if (roleIds.length > 0) {
            try {
                const rolePerms = await (prisma as any).authRolePermission.findMany({
                    where: { roleId: { in: roleIds } },
                    include: { permission: true }
                });
                rolePerms.forEach((rp: any) => effectivePermissions.add(rp.permission.fullPermission));
            } catch (e) {
                // Raw SQL fallback if models out of sync
                const rawPerms = await prisma.$queryRaw<any[]>`
                    SELECT p."fullPermission" 
                    FROM auth_permission p
                    JOIN auth_role_permission rp ON p.id = rp."permissionId"
                    WHERE rp."roleId" IN (${roleIds.join(',')})
                `;
                rawPerms.forEach(p => effectivePermissions.add(p.fullPermission));
            }
        }

        // 2. Add grants
        if (grantIds.length > 0) {
            try {
                const grants = await (prisma as any).authPermission.findMany({
                    where: { id: { in: grantIds } }
                });
                grants.forEach((p: any) => effectivePermissions.add(p.fullPermission));
            } catch (e) {
                const rawGrants = await prisma.$queryRaw<any[]>`
                    SELECT "fullPermission" FROM auth_permission WHERE id IN (${grantIds.join(',')})
                `;
                rawGrants.forEach(p => effectivePermissions.add(p.fullPermission));
            }
        }

        // 3. Subtract denies
        if (denyIds.length > 0) {
            try {
                const denies = await (prisma as any).authPermission.findMany({
                    where: { id: { in: denyIds } }
                });
                denies.forEach((p: any) => effectivePermissions.delete(p.fullPermission));
            } catch (e) {
                const rawDenies = await prisma.$queryRaw<any[]>`
                    SELECT "fullPermission" FROM auth_permission WHERE id IN (${denyIds.join(',')})
                `;
                rawDenies.forEach(p => effectivePermissions.delete(p.fullPermission));
            }
        }

        return NextResponse.json({
            permissions: Array.from(effectivePermissions),
            nodeId: nodeId
        });
    } catch (error: any) {
        console.error("[PREVIEW_PERMISSIONS] Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
