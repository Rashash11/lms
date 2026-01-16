import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { loadE2ESeedFixtures } from '../helpers/seed';

async function getCsrfHeader(page: { context: () => any }) {
    const csrfToken = (await page.context().cookies()).find((c: any) => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

test.describe('Admin Flows', () => {
    test('users list loads and can open create user page', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/users');
        await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
        await page.getByRole('button', { name: /add user/i }).click();
        await page.getByRole('menuitem', { name: /add user manually/i }).click();
        await expect(page).toHaveURL(/\/admin\/users\/new$/);

        await context.close();
    });

    test('can create and delete a user via UI', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const email = `e2e-admin-user-${unique}@test.local`;
        const username = `e2e_admin_${unique}`;

        try {
            await page.goto('/admin/users/new');
            await page.getByLabel('First name').fill('E2E');
            await page.getByLabel('Last name').fill('AdminUser');
            await page.getByLabel('Email').fill(email);
            await page.getByLabel('Username').fill(username);
            await page.getByLabel('Password').fill('TestPass123!');

            const createResponsePromise = page.waitForResponse(r => r.url().includes('/api/users') && r.request().method() === 'POST');
            await page.getByRole('button', { name: 'Save' }).click();
            const createResponse = await createResponsePromise;
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            const createdId = created?.id as string | undefined;
            expect(createdId).toBeTruthy();

            await page.waitForURL(/\/admin\/users$/);
            await page.getByRole('textbox', { name: 'Search', exact: true }).fill(email);
            await page.waitForTimeout(300);
            await expect(page.getByText(email)).toBeVisible();

            const deleteRes = await page.request.delete(`/api/users/${createdId}`, {
                headers: { ...(await getCsrfHeader(page)) },
            });
            expect([200, 204]).toContain(deleteRes.status());

            await page.reload();
            await page.getByRole('textbox', { name: 'Search', exact: true }).fill(email);
            await page.waitForTimeout(300);
            await expect(page.getByText(email)).toHaveCount(0);
        } finally {
            await context.close();
        }
    });

    test('seeded course details load', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto(`/admin/courses/${seed.courseAId}`);
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await expect(page.getByText('Test Course A')).toBeVisible();

        await context.close();
    });

    test('can create and delete a group via UI', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const name = `E2E Group ${Date.now()}`;

        try {
            await page.goto('/admin/groups');
            await page.getByRole('button', { name: /create group/i }).click();
            await expect(page).toHaveURL(/\/admin\/groups\/new$/);

            const nameInput = page.locator('xpath=//h5[normalize-space(.)="Add group"]/following::input[1]');
            await nameInput.fill(name);

            const createResponsePromise = page.waitForResponse(r => r.url().includes('/api/groups') && r.request().method() === 'POST');
            await page.getByRole('button', { name: 'Save' }).click();
            const createResponse = await createResponsePromise;
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            const groupId = created?.id as string | undefined;
            expect(groupId).toBeTruthy();

            await page.waitForURL(/\/admin\/groups$/);
            await expect(page.getByText(name)).toBeVisible();

            const deleteRes = await page.request.delete('/api/groups', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { ids: [groupId] },
            });
            expect([200, 204]).toContain(deleteRes.status());

            await page.reload();
            await expect(page.getByText(name)).toHaveCount(0);
        } finally {
            await context.close();
        }
    });

    test('can create a course from list and open editor', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        let createdCourseId: string | null = null;
        try {
            await page.goto('/admin/courses');
            await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();

            await page.getByRole('button', { name: /add course/i }).click();
            const createResponsePromise = page.waitForResponse(r => r.url().includes('/api/courses') && r.request().method() === 'POST');
            await page.getByRole('menuitem', { name: /create new course/i }).click();
            const createResponse = await createResponsePromise;
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            createdCourseId = created?.id || null;
            expect(createdCourseId).toBeTruthy();

            await page.waitForURL(new RegExp(`/admin/courses/new/edit\\?id=${createdCourseId}`));
            await expect(page.getByRole('heading', { name: 'New course' }).first()).toBeVisible();
        } finally {
            if (createdCourseId) {
                await page.request.delete(`/api/courses/${createdCourseId}`, {
                    headers: { ...(await getCsrfHeader(page)) },
                });
            }
            await context.close();
        }
    });

    test('learning path new can create and open add course modal', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/learning-paths/new');
        await page.getByLabel('Name').fill('E2E Learning Path');
        await page.getByRole('button', { name: /add course/i }).click();

        await expect(page.getByRole('dialog', { name: /add course to learning path/i })).toBeVisible();

        await context.close();
    });

    test('learning path enroll users works', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/learning-paths/new');
        await page.getByLabel('Name').fill(`E2E Enroll Path ${Date.now()}`);
        await page.getByRole('button', { name: /add course/i }).click();

        await expect(page).toHaveURL(/\/admin\/learning-paths\/[^/]+\/edit/);

        const url = new URL(page.url());
        url.search = '?drawer=users';
        await page.goto(url.toString());

        await expect(page.getByText('Enroll to learning path')).toBeVisible();
        await page.getByRole('button', { name: /enroll to learning path/i }).click();

        const dialog = page.getByRole('dialog', { name: /enroll users to learning path/i });
        await expect(dialog).toBeVisible();

        const firstUser = dialog.locator('li [role="button"]').first();
        await firstUser.evaluate((el: any) => el.click());
        const enrollButton = dialog.getByRole('button', { name: /^Enroll\s+\d+\s+user/i });
        await expect(enrollButton).toBeEnabled();
        await enrollButton.evaluate((el: any) => el.click());

        await expect(dialog).toBeHidden();
        await expect(page.getByText(/failed to create enrollment/i)).toHaveCount(0);

        await context.close();
    });

    test('courses list loads from sidebar navigation', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin');
        await page.getByRole('link', { name: 'Courses', exact: true }).click();
        await expect(page).toHaveURL(/\/admin\/courses$/);
        await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();
        await expect(page.getByRole('progressbar')).toHaveCount(0);

        await context.close();
    });
});
