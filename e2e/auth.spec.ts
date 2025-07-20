import { test, expect } from '@playwright/test';

test.describe('認証機能', () => {
  test('トップページにアクセスできる', async ({ page }) => {
    await page.goto('/');
    
    // ページが正常に読み込まれることを確認
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // タイトルが存在することを確認
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('ログインページにアクセスできる', async ({ page }) => {
    await page.goto('/sign-in');
    
    // NextAuth.jsのログインページのURLに遷移していることを確認
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // ログインフォームの要素が存在することを確認
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="signin-submit-button"]')).toBeVisible();
  });

  test('admin@example.com / password でログインできる', async ({ page }) => {
    // NextAuth.jsのログインページに直接アクセス
    await page.goto('/auth/signin');
    
    // ログインページが表示されていることを確認
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // メールアドレスとパスワードを入力
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    
    // ログインボタンをクリック
    await page.click('[data-testid="signin-submit-button"]');
    
    // ログイン後のリダイレクトを待つ（/auth/signinから離れるまで待つ）
    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { 
      timeout: 10000 
    });
    
    // ログイン成功後、認証されたページに遷移していることを確認
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth/signin');
    
    // ダッシュボード、ホーム、またはプロフィールページに遷移していることを確認
    // NextAuth.jsのデフォルトでは、ログイン後は元のページ（/sign-in）か、callbackUrlで指定されたページに戻る
    expect(currentUrl).toMatch(/localhost:3000/);
  });
});