import { test as base, expect } from '@playwright/test';
import { attachConsoleFail } from '../helpers/consoleFail';
import { attachApiObserver } from '../helpers/apiAssert';

export const test = base.extend<{
    guards: {
        console: ReturnType<typeof attachConsoleFail>;
        api: ReturnType<typeof attachApiObserver>;
    };
}>({
    guards: [
        async ({ page }, use, testInfo) => {
            const consoleGuard = attachConsoleFail(page, testInfo);
            const apiGuard = attachApiObserver(page, testInfo);

            await use({ console: consoleGuard, api: apiGuard });

            const shouldFail = testInfo.status === 'passed';

            try {
                await apiGuard.assertClean();
            } catch (e) {
                if (shouldFail) throw e;
            }

            try {
                await consoleGuard.assertClean();
            } catch (e) {
                if (shouldFail) throw e;
            }
        },
        { auto: true },
    ],
});

export { expect };
