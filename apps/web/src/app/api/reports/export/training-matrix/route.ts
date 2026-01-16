import { NextRequest } from 'next/server';
import { withGuard, apiResponse, GuardedContext } from '@/lib/api-guard';
import { jobs } from '@/lib/jobs/queues';

export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'reports:export',
        auditEvent: 'REPORT_EXPORT'
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { search, branchId, groupId } = body;

        const job = await jobs.report.export({
            reportId: 'training-matrix',
            format: 'xlsx',
            tenantId: ctx.session.tenantId!,
            userId: ctx.session.userId,
            filters: { search, branchId, groupId }
        });

        return apiResponse({ 
            message: 'Export job queued', 
            jobId: job.id 
        }, 202);
    });
}
