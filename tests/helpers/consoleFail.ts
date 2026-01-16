import type { Page, TestInfo, ConsoleMessage } from '@playwright/test';

export interface ConsoleFailOptions {
    failOnWarn?: boolean;
}

export interface ConsoleFailCapture {
    consoleErrors: string[];
    consoleWarns: string[];
    pageErrors: string[];
}

export function attachConsoleFail(page: Page, testInfo: TestInfo, options: ConsoleFailOptions = {}): ConsoleFailCapture & { assertClean: () => Promise<void> } {
    const consoleErrors: string[] = [];
    const consoleWarns: string[] = [];
    const pageErrors: string[] = [];

    const onConsole = (msg: ConsoleMessage) => {
        const text = msg.text();
        const loc = msg.location();
        const withLoc = loc?.url ? `${text} @ ${loc.url}:${loc.lineNumber || 0}:${loc.columnNumber || 0}` : text;
        if (msg.type() === 'error') consoleErrors.push(withLoc);
        if (msg.type() === 'warning') consoleWarns.push(withLoc);
    };
    const onPageError = (error: Error) => pageErrors.push(error.message);

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    const assertClean = async () => {
        page.off('console', onConsole);
        page.off('pageerror', onPageError);

        const failOnWarn = options.failOnWarn ?? (process.env.FAIL_ON_CONSOLE_WARN === '1');
        const hasFailure = consoleErrors.length > 0 || pageErrors.length > 0 || (failOnWarn && consoleWarns.length > 0);

        if (hasFailure) {
            await testInfo.attach('console-errors.json', {
                body: Buffer.from(JSON.stringify({ consoleErrors, consoleWarns, pageErrors }, null, 2)),
                contentType: 'application/json',
            });
        }

        const parts: string[] = [];
        if (consoleErrors.length) parts.push(`console.error: ${consoleErrors.length}`);
        if (failOnWarn && consoleWarns.length) parts.push(`console.warn: ${consoleWarns.length}`);
        if (pageErrors.length) parts.push(`pageerror: ${pageErrors.length}`);
        if (parts.length) {
            const sample = [
                ...consoleErrors.slice(0, 3).map((m) => `console.error: ${m}`),
                ...pageErrors.slice(0, 3).map((m) => `pageerror: ${m}`),
                ...(failOnWarn ? consoleWarns.slice(0, 3).map((m) => `console.warn: ${m}`) : []),
            ];
            throw new Error(`Console/page errors detected (${parts.join(', ')}):\n${sample.join('\n')}`);
        }
    };

    return { consoleErrors, consoleWarns, pageErrors, assertClean };
}
