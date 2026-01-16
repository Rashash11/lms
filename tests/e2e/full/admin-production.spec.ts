import { newContextAsRole } from '../../helpers/login';
import { test, expect } from '../e2eTest';
import { getRoleRoutes } from '../../helpers/routes';

async function getCsrfHeader(page: { context: () => any }) {
    const csrfToken = (await page.context().cookies()).find((c: any) => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

function unique(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

async function clickSafeButtonsOnPage(page: any) {
    const deny = [
        /^delete$/i,
        /^remove/i,
        /^revoke/i,
        /^logout$/i,
        /^cancel$/i,
        /^save$/i,
        /^create$/i,
        /^enroll/i,
        /^deactivate$/i,
        /^activate$/i,
    ];
    const buttons = page.getByRole('button').filter({ hasNotText: '' });
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 8); i++) {
        const b = buttons.nth(i);
        const text = (await b.innerText().catch(() => '')).trim();
        if (!text) continue;
        if (deny.some((r) => r.test(text))) continue;
        await b.click({ trial: true }).catch(() => undefined);
        await b.click().catch(() => undefined);
        await page.keyboard.press('Escape').catch(() => undefined);
    }
}

test.describe('Admin Production Regression', () => {
    test.setTimeout(8 * 60_000);

    test('admin route set loads and is interactive', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        const routes = getRoleRoutes('admin').filter((r) =>
            r !== '/admin/courses/new/edit' &&
            !/^\/admin\/learning-paths\/[^/]+\/edit$/.test(r)
        );

        try {
            for (const route of routes) {
                await page.goto(route);
                await page.waitForLoadState('networkidle').catch(() => undefined);
                await expect(page).not.toHaveURL(/\/login/);
                await clickSafeButtonsOnPage(page);
            }
        } finally {
            await context.close();
        }
    });

    test('notifications: create, toggle, duplicate, delete', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const name = unique('E2E_Notification');
        let createdId: string | null = null;
        let duplicatedId: string | null = null;

        try {
            await page.goto('/admin/notifications');
            await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();

            await page.getByRole('button', { name: /add notification/i }).click();
            await expect(page.getByTestId('notification-drawer')).toBeVisible();
            await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
            await page.getByRole('combobox', { name: 'Event', exact: true }).click();
            await expect(page.getByRole('option').first()).toBeVisible();
            await page.getByRole('option').first().click();

            const hours = page.getByRole('spinbutton', { name: /hours/i });
            if (await hours.count()) {
                await hours.first().fill('1');
            }

            // recipient selection skipped; defaults to ALL_USERS

            await page.getByTestId('notification-subject').fill('E2E subject');
            await page.getByTestId('notification-body').fill('E2E body {{user.name}}');

            const createResponsePromise = page.waitForResponse((r) =>
                r.url().includes('/api/admin/notifications') && r.request().method() === 'POST'
            );
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            const createdRes = await createResponsePromise;
            expect(createdRes.ok()).toBe(true);
            const createdBody = await createdRes.json().catch(() => ({} as any));
            createdId = createdBody?.data?.id || createdBody?.id || null;
            expect(createdId).toBeTruthy();

            await page.getByPlaceholder('Search').fill(name);
            await expect(page.getByText(name)).toBeVisible();

            const row = page.locator('tr', { hasText: name }).first();
            await row.getByRole('button').last().click();
            const toggleResponsePromise = page.waitForResponse((r) =>
                r.url().includes(`/api/admin/notifications/${createdId}/toggle`) && r.request().method() === 'PATCH'
            );
            await page.getByRole('menuitem', { name: /deactivate|activate/i }).click();
            const toggleRes = await toggleResponsePromise;
            expect(toggleRes.ok()).toBe(true);

            await page.getByPlaceholder('Search').fill('');
            await page.getByPlaceholder('Search').fill(name);
            await expect(page.locator('tr', { hasText: name }).getByText(/inactive/i)).toHaveCount(1);

            await row.getByRole('button').last().click();
            const dupResponsePromise = page.waitForResponse((r) =>
                r.url().includes(`/api/admin/notifications/${createdId}/duplicate`) && r.request().method() === 'POST'
            );
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            const dupRes = await dupResponsePromise;
            expect(dupRes.ok()).toBe(true);
            const dupBody = await dupRes.json().catch(() => ({} as any));
            duplicatedId = dupBody?.data?.id || dupBody?.id || null;

            await row.getByRole('button').last().click();
            await page.getByRole('menuitem', { name: /^delete$/i }).click();
            const delResponsePromise = page.waitForResponse((r) =>
                r.url().includes(`/api/admin/notifications/${createdId}`) && r.request().method() === 'DELETE'
            );
            await page.getByRole('button', { name: /^delete$/i }).click();
            const delRes = await delResponsePromise;
            expect(delRes.ok()).toBe(true);

            await page.getByPlaceholder('Search').fill(name);
            await expect(page.getByText(name)).toHaveCount(0);
        } finally {
            const headers = await getCsrfHeader(page);
            if (duplicatedId) {
                await page.request.delete(`/api/admin/notifications/${duplicatedId}`, { headers }).catch(() => undefined);
            }
            if (createdId) {
                await page.request.delete(`/api/admin/notifications/${createdId}`, { headers }).catch(() => undefined);
            }
            await context.close();
        }
    });

    test('assignments: create and delete', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const title = unique('E2E_Assignment');
        let assignmentId: string | null = null;

        try {
            await page.goto('/admin/assignments/new');
            await page.getByRole('textbox', { name: 'Assignment Title', exact: true }).fill(title);

            const createResponsePromise = page.waitForResponse((r) =>
                r.url().includes('/api/assignments') && r.request().method() === 'POST'
            );
            await page.getByRole('button', { name: /^create$/i }).click();
            const createRes = await createResponsePromise;
            if (!createRes.ok()) {
                throw new Error(`Assignment create failed: ${createRes.status()} ${await createRes.text().catch(() => '')}`);
            }
            const created = await createRes.json().catch(() => ({} as any));
            assignmentId = created?.id || created?.data?.id || null;
            expect(assignmentId).toBeTruthy();

            await page.waitForURL(/\/admin\/assignments$/);
            await page.getByTestId('assignments-search').fill(title);
            await expect(page.getByText(title)).toBeVisible();
        } finally {
            if (assignmentId) {
                await page.request.delete(`/api/assignments/${assignmentId}`, {
                    headers: await getCsrfHeader(page),
                }).catch(() => undefined);
            }
            await context.close();
        }
    });

    test('branches: create, update, delete', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const branchName = `e2e-branch-${Date.now()}`;
        let branchId: string | null = null;

        try {
            await page.goto('/admin/branches/create');
            await expect(page.getByText('Add branch')).toBeVisible();
            await page.getByPlaceholder('Type the site name').fill(branchName.slice(0, 25));

            const createResponsePromise = page.waitForResponse((r) =>
                r.url().includes('/api/branches') && r.request().method() === 'POST'
            );
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            const createRes = await createResponsePromise;
            expect(createRes.ok()).toBe(true);
            const created = await createRes.json().catch(() => ({} as any));
            branchId = created?.id || created?.data?.id || null;
            expect(branchId).toBeTruthy();

            await page.waitForURL(new RegExp(`/admin/branches/${branchId}/edit`));
            await page.getByPlaceholder('Type the branch title').fill('E2E Branch Title');

            const updateResponsePromise = page.waitForResponse((r) =>
                r.url().includes(`/api/branches/${branchId}`) && r.request().method() === 'PATCH'
            );
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            const updRes = await updateResponsePromise;
            expect(updRes.ok()).toBe(true);
        } finally {
            if (branchId) {
                await page.request.delete(`/api/branches/${branchId}`, {
                    headers: await getCsrfHeader(page),
                }).catch(() => undefined);
            }
            await context.close();
        }
    });

    test('security: sessions and audit pages render', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        try {
            await page.goto('/admin/security/sessions');
            await page.waitForLoadState('networkidle').catch(() => undefined);
            await expect(page).not.toHaveURL(/\/login/);

            await page.goto('/admin/security/audit');
            await page.waitForLoadState('networkidle').catch(() => undefined);
            await expect(page).not.toHaveURL(/\/login/);
        } finally {
            await context.close();
        }
    });
});
