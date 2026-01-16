import type { Browser, Page, TestInfo } from '@playwright/test';
import { attachApiObserver } from './apiAssert';
import { attachConsoleFail } from './consoleFail';
import { newContextAsRole, type TestRole } from './login';

export async function newScanPage(browser: Browser, role: TestRole, testInfo: TestInfo): Promise<{
    page: Page;
    close: () => Promise<void>;
    assertClean: () => Promise<void>;
}> {
    const context = await newContextAsRole(browser, role);
    const page = await context.newPage();
    const consoleGuard = attachConsoleFail(page, testInfo);
    const apiGuard = attachApiObserver(page, testInfo);

    return {
        page,
        close: async () => {
            await context.close().catch(() => undefined);
        },
        assertClean: async () => {
            await apiGuard.assertClean();
            await consoleGuard.assertClean();
        },
    };
}

