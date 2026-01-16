import path from 'node:path';
import type { Browser, BrowserContext } from '@playwright/test';

export type TestRole = 'admin' | 'super-instructor' | 'instructor' | 'learner' | 'learner-b' | 'admin-b';

export function getRoleStorageStatePath(role: TestRole, rootDir = process.cwd()) {
    return path.join(rootDir, 'tests', 'e2e', 'storage', `${role}.json`);
}

export async function newContextAsRole(browser: Browser, role: TestRole): Promise<BrowserContext> {
    return browser.newContext({ storageState: getRoleStorageStatePath(role) });
}

