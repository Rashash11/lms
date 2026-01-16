import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for LMS E2E tests
 * 
 * Usage:
 * - Fast tests (PR gate): npm run test:e2e:fast
 * - Full tests (nightly): npm run test:e2e:full
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Run tests in files in parallel */
    fullyParallel: false,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Limit parallel workers on CI */
    workers: 1,

    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
        ['json', { outputFile: 'playwright-results.json' }],
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL for navigation */
        baseURL: process.env.BASE_URL || 'http://localhost:3000',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'on-first-retry',

        /* Timeout for actions */
        actionTimeout: 10000,

        /* Navigation timeout */
        navigationTimeout: 30000,
    },

    /* Configure projects */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Run local dev server before starting the tests */
    webServer: {
        command: 'npx tsx scripts/e2e-webserver.ts',
        url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/e2e/ready`,
        reuseExistingServer: true,
        timeout: 600 * 1000,
    },

    /* Output folder for test artifacts */
    outputDir: 'test-results',

    /* Global timeout */
    timeout: 60000,

    /* Expect timeout */
    expect: {
        timeout: 10000,
    },
});
