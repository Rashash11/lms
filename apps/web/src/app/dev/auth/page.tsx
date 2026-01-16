import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken, CustomJWTPayload } from '@/lib/auth';

// Block in production
export const dynamic = 'force-dynamic';

async function getAuthStatus() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    const refreshCookie = cookieStore.get('refreshToken');

    let claims: CustomJWTPayload | null = null;
    let meResponse: unknown = null;

    if (sessionCookie?.value) {
        try {
            claims = await verifyAccessToken(sessionCookie.value);
        } catch { }

        // Also fetch /me for comparison
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
                headers: { Cookie: `session=${sessionCookie.value}` },
                cache: 'no-store',
            });
            meResponse = await res.json();
        } catch { }
    }

    return {
        hasSession: !!sessionCookie?.value,
        hasRefresh: !!refreshCookie?.value,
        sessionPreview: sessionCookie?.value?.slice(0, 50) + '...',
        refreshPreview: refreshCookie?.value?.slice(0, 20) + '...',
        claims,
        meResponse,
    };
}

export default async function DevAuthPage() {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
        redirect('/');
    }

    const status = await getAuthStatus();

    return (
        <div style={{
            padding: '2rem',
            fontFamily: 'monospace',
            backgroundColor: '#1a1a2e',
            color: '#eee',
            minHeight: '100vh'
        }}>
            <h1 style={{ color: '#00d9ff', marginBottom: '1rem' }}>🔐 Auth Debug (Dev Only)</h1>

            <div style={{
                backgroundColor: '#16213e',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
            }}>
                <h2 style={{ color: '#e94560', marginBottom: '0.5rem' }}>Cookie Status</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>session cookie</td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', color: status.hasSession ? '#00ff00' : '#ff0000' }}>
                                {status.hasSession ? '✅ Present' : '❌ Missing'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>refreshToken cookie</td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', color: status.hasRefresh ? '#00ff00' : '#ff0000' }}>
                                {status.hasRefresh ? '✅ Present' : '❌ Missing'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={{
                backgroundColor: '#16213e',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
            }}>
                <h2 style={{ color: '#e94560', marginBottom: '0.5rem' }}>JWT Claims (from verifyAccessToken)</h2>
                {status.claims ? (
                    <pre style={{
                        backgroundColor: '#0f0f23',
                        padding: '1rem',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '0.85rem'
                    }}>
                        {JSON.stringify(status.claims, null, 2)}
                    </pre>
                ) : (
                    <p style={{ color: '#ff6b6b' }}>No valid session or claims could not be verified</p>
                )}
            </div>

            <div style={{
                backgroundColor: '#16213e',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
            }}>
                <h2 style={{ color: '#e94560', marginBottom: '0.5rem' }}>/api/auth/me Response</h2>
                {status.meResponse ? (
                    <pre style={{
                        backgroundColor: '#0f0f23',
                        padding: '1rem',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '0.85rem'
                    }}>
                        {JSON.stringify(status.meResponse, null, 2)}
                    </pre>
                ) : (
                    <p style={{ color: '#ff6b6b' }}>No response from /api/auth/me</p>
                )}
            </div>

            <div style={{
                backgroundColor: '#16213e',
                padding: '1rem',
                borderRadius: '8px'
            }}>
                <h2 style={{ color: '#e94560', marginBottom: '0.5rem' }}>Actions</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <form action="/api/auth/refresh" method="POST">
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#00d9ff',
                                color: '#000',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🔄 Refresh Token
                        </button>
                    </form>
                    <form action="/api/auth/logout-all" method="POST">
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#e94560',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🚪 Logout All
                        </button>
                    </form>
                    <a
                        href="/login"
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#4ecca3',
                            color: '#000',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                        }}
                    >
                        🔑 Go to Login
                    </a>
                </div>
            </div>

            <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.8rem' }}>
                ⚠️ This page is only available in development mode.
            </p>
        </div>
    );
}
