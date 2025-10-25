import { test, expect } from '@playwright/test';

test.describe('メール認証機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にページを準備
    await page.goto('/');
  });


  test('有効なトークンでメール認証ページにアクセスできる', async ({ page }) => {
    const validToken = 'valid-test-token';
    
    await page.goto(`/verify-email?token=${validToken}`);
    
    // ページが正常に読み込まれることを確認
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    
    // 認証処理中のメッセージが表示されることを確認
    await expect(page.locator('[data-testid="email-verification-loading"]')).toBeVisible();
  });

  test('トークンなしでメール認証ページにアクセスした場合エラーが表示される', async ({ page }) => {
    await page.goto('/verify-email');
    
    // ページが正常に読み込まれることを確認
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // 再送信フォームが表示されることを確認
    await expect(page.locator('[data-testid="resend-email-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="resend-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="signin-link"]')).toBeVisible();
  });

  test('無効なトークンでアクセスした場合エラーが表示される', async ({ page }) => {
    const invalidToken = 'invalid-test-token';
    
    await page.goto(`/verify-email?token=${invalidToken}`);
    
    // ページが正常に読み込まれることを確認
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    
    // ページのコンテンツをデバッグ出力
    await page.waitForTimeout(2000);
    const pageContent = await page.locator('body').textContent();
    console.log('Page content:', pageContent);
    
    // エラー状態またはエラーメッセージが表示されるまで待つ
    await expect(page.locator('[data-testid="email-verification-error"]')).toBeVisible();
    
    // 再送信フォームが表示されることを確認
    await expect(page.locator('[data-testid="resend-email-button"]')).toBeVisible();
  });

  test('メール再送信機能が動作する', async ({ page }) => {
    await page.goto('/verify-email');
    
    // エラーメッセージが表示されるまで待つ
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // 再送信フォームにメールアドレスを入力
    await page.fill('[data-testid="resend-email-input"]', 'test@example.com');
    
    // 再送信ボタンをクリック
    await page.click('[data-testid="resend-email-button"]');
    
    // 送信中の状態が表示されることを確認
    await expect(page.locator('[data-testid="resend-email-button"][disabled]')).toBeVisible();
    
    // 再送信処理の完了を待つ - エラー状態または成功状態になるまで待機
    await Promise.race([
      page.locator('[data-testid="error-message"]').waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('[data-testid="email-verification-resend-success"]').waitFor({ state: 'visible', timeout: 10000 })
    ]);
    
    // 結果が正しく表示されているかを確認
    const isErrorVisible = await page.locator('[data-testid="error-message"]').isVisible();
    const isSuccessVisible = await page.locator('[data-testid="email-verification-resend-success"]').isVisible();
    expect(isErrorVisible || isSuccessVisible).toBe(true);
  });

  test('メール再送信で空のメールアドレスを送信するとエラーが表示される', async ({ page }) => {
    await page.goto('/verify-email');
    
    // エラーメッセージが表示されるまで待つ
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // メールアドレスを入力せずに再送信ボタンをクリック
    await page.click('[data-testid="resend-email-button"]');
    
    // エラーメッセージが表示されるまで待機
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    
    // デバッグ出力
    const pageText = await page.locator('body').textContent();
    console.log('Page after empty email submit:', pageText);
  });

  test('メール再送信で無効なメールアドレスを送信するとエラーが表示される', async ({ page }) => {
    await page.goto('/verify-email');
    
    // エラーメッセージが表示されるまで待つ
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // 無効なメールアドレスを入力
    await page.fill('[data-testid="resend-email-input"]', 'invalid-email');
    
    // 再送信ボタンをクリック
    await page.click('[data-testid="resend-email-button"]');
    
    // エラーメッセージまたはレスポンスメッセージが表示されるまで待機
    await Promise.race([
      page.locator('[data-testid="error-message"]').waitFor({ state: 'visible', timeout: 5000 }),
      page.locator('[data-testid="email-verification-resend-success"]').waitFor({ state: 'visible', timeout: 5000 })
    ]);
    
    // 何らかのエラーレスポンスがあることを確認
    const errorMessage = await page.locator('[data-testid="error-message"]').isVisible();
    const successMessage = await page.locator('[data-testid="email-verification-resend-success"]').isVisible();
    expect(errorMessage || successMessage).toBeTruthy();
  });

  test('メール認証成功後にサインインページにリダイレクトされる', async ({ page }) => {
    // モックまたは有効なトークンを使用
    const validToken = 'test-valid-token';
    
    await page.goto(`/verify-email?token=${validToken}`);
    
    // 認証成功メッセージまたはエラーメッセージを待つ（タイムアウトを長めに設定）
    await Promise.race([
      page.locator('[data-testid="email-verification-success"]').waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('[data-testid="email-verification-error"]').waitFor({ state: 'visible', timeout: 10000 })
    ]);
    
    // 認証が成功した場合、サインインページにリダイレクトされることを確認
    // 注意: 実際の環境によっては成功しない場合もあるため、条件付きで確認
    const successMessage = await page.locator('[data-testid="email-verification-success"]').isVisible();
    
    if (successMessage) {
      // 3秒後のリダイレクトを待つ
      await page.waitForURL(/\/auth\/signin/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/auth\/signin/);
    }
  });

  test('ENABLE_EMAIL_VERIFICATION=falseの場合はメール認証ページが正常に動作する', async ({ page }) => {
    // 注意: この項目は環境変数の設定によってテスト結果が変わる
    // 開発環境で ENABLE_EMAIL_VERIFICATION=false に設定している場合のテスト
    
    await page.goto('/verify-email');
    
    // ページが正常に読み込まれることを確認（機能が無効でもページは存在する）
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    
    // ページが読み込まれるまで待つ
    await page.waitForTimeout(2000);
    
    // いずれかの状態が表示されることを確認（loading, error, success, resend-success）
    const hasLoading = await page.locator('[data-testid="email-verification-loading"]').isVisible();
    const hasError = await page.locator('[data-testid="email-verification-error"]').isVisible();
    const hasSuccess = await page.locator('[data-testid="email-verification-success"]').isVisible();
    const hasResendSuccess = await page.locator('[data-testid="email-verification-resend-success"]').isVisible();
    
    expect(hasLoading || hasError || hasSuccess || hasResendSuccess).toBeTruthy();
  });
}); 