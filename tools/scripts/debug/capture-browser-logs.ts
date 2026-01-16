import { chromium } from '@playwright/test';

const baseUrl = process.env.URL || 'http://localhost:3000';
const waitMs = Number(process.env.WAIT_MS || 3000);
const paths = (process.env.PATHS || '/,/login,/admin,/admin/users,/admin/reports')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

async function main() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const logs: string[] = [];

    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i, (route) => route.abort());

    page.on('console', (msg) => {
        logs.push(`[console:${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
        logs.push(`[pageerror] ${err instanceof Error ? err.message : String(err)}`);
    });
    page.on('requestfailed', (req) => {
        const failure = req.failure();
        logs.push(`[requestfailed] ${req.url()}${failure?.errorText ? ` (${failure.errorText})` : ''}`);
    });

    for (const path of paths) {
        const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        logs.push(`[nav] ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(waitMs);
    }

    const last = logs.slice(-25);
    process.stdout.write(last.length ? `${last.join('\n')}\n` : '(no console logs captured)\n');

    await browser.close();
}

main().catch((e) => {
    const message = e instanceof Error ? e.message : String(e);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});
