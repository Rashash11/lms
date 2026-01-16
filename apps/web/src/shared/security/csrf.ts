export function getCsrfToken(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
}

