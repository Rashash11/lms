import type { Page, TestInfo } from '@playwright/test';

export async function captureArtifacts(page: Page, testInfo: TestInfo, name: string) {
    try {
        await testInfo.attach(`${name}.png`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png',
        });
    } catch {}
}

