import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateQuery, searchSchema, ValidationError } from '@/lib/validations';
import { enforceNodeWhere } from '@/lib/auth';

/**
 * GET /api/admin/users/export
 * Export users list as CSV
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'user:read',
        auditEvent: 'USER_EXPORT',
    }, async (ctx: GuardedContext) => {
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, searchSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { search, status } = query;

        // 1. Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        const scopedWhere = enforceNodeWhere(ctx.session, where, 'nodeId');

        // 2. Fetch all matching users
        const users = await prisma.user.findMany({
            where: scopedWhere,
            orderBy: { createdAt: 'desc' },
            include: { roles: true }
        });

        // 3. Generate CSV
        const headers = ['ID', 'Email', 'Username', 'First Name', 'Last Name', 'Role', 'Status', 'Created At'];
        const csvRows = [headers.join(',')];

        for (const user of users) {
            const row = [
                user.id,
                user.email,
                user.username,
                `"${user.firstName || ''}"`,
                `"${user.lastName || ''}"`,
                user.role,
                user.status,
                user.createdAt.toISOString()
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');

        // 4. Return as downloadable file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
            }
        });
    });
}
