import { getCsrfToken as getCsrfTokenInternal } from '@shared/security/csrf';

export function getCsrfToken(): string {
    return getCsrfTokenInternal() || '';
}
