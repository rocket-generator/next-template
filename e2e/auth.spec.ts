import { test, expect } from '@playwright/test';

test.describe('認証機能', () => {
  test('トップページにアクセスできる', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('http://localhost:3000/');

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('/signin でサインインフォームが表示される', async ({ page }) => {
    await page.goto('/signin');

    await expect(page).toHaveURL(/\/auth\/signin$/);

    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="signin-submit-button"]')).toBeVisible();
  });

  test('admin@example.com / password でダッシュボードに遷移する', async ({ page }) => {
    await page.goto('/signin');

    await expect(page).toHaveURL(/\/auth\/signin$/);

    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password');

    await Promise.all([
      page.waitForURL((url) => url.pathname !== '/signin', {
        timeout: 10000,
      }),
      page.click('[data-testid="signin-submit-button"]'),
    ]);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('body')).toContainText('Dashboard');
  });
});
