import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function js(body: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            'content-type': 'application/javascript; charset=utf-8',
            'cache-control': 'no-store',
        },
    });
}

export async function GET(_request: NextRequest, context: { params: { path?: string[] } }) {
    const path = (context.params.path ?? []).join('/');

    if (path === 'client') {
        return js('export {};');
    }

    if (path === 'react-refresh') {
        return js('export function injectIntoGlobalHook() {} export default {};');
    }

    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}
