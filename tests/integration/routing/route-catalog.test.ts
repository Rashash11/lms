
import { describe, it, expect } from 'vitest';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execAsync = promisify(exec);

describe('Route Catalog Audit', () => {
    it('should pass the route audit script', async () => {
        try {
            // Run the audit script
            // We expect it to fail currently, but this test serves as the regression guard
            // once we fix everything.
            // For now, I will NOT fail the test if it fails, but I will log it.
            // Actually, the user wants "tests that fail if routing breaks again".
            // So I MUST make it fail if the script fails.
            
            const rootDir = path.resolve(__dirname, '../../..');
            const { stdout, stderr } = await execAsync('npm run routes:audit', { cwd: rootDir });
            
            // If we reach here, it passed (exit code 0)
            expect(true).toBe(true);
        } catch (error: any) {
            // If it fails (exit code 1), the test fails
            const output = error.stdout || error.message;
            console.error(output);
            throw new Error(`Route audit failed. See output above.`);
        }
    }, 30000); // 30s timeout
});
