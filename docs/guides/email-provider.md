# メールプロバイダー追加ガイド

既存のメールサービスに新プロバイダーを追加する方法。

## 現在のアーキテクチャ

メールサービスは Provider パターン：

```
src/libraries/email.ts
├── EmailService (interface)   # メール送信の抽象化
├── EmailProvider (interface)  # プロバイダーの抽象化
├── SESProvider (class)        # AWS SES 実装
└── EmailServiceImpl (class)   # サービス実装
```

## 追加手順

### 1. 設定インターフェース

```typescript
export interface ResendProviderConfig {
  apiKey: string;
  fromEmail?: string;
}
```

### 2. プロバイダークラス

```typescript
export class ResendProvider implements EmailProvider {
  private config: ResendProviderConfig;

  constructor(config: ResendProviderConfig) {
    this.config = config;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Edge Runtime 互換のため dynamic import
      const { Resend } = await import("resend");
      const resend = new Resend(this.config.apiKey);
      const result = await resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error("Resend email sending failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
```

### 3. 設定ファクトリー

```typescript
export function createResendProviderConfig(): ResendProviderConfig {
  return {
    apiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.RESEND_FROM_EMAIL,
  };
}
```

### 4. メインファクトリー更新

```typescript
export function createEmailServiceInstance(): EmailService {
  const providerType = process.env.EMAIL_PROVIDER || "ses";
  let provider: EmailProvider;
  let fromEmail: string;

  switch (providerType) {
    case "resend": {
      const cfg = createResendProviderConfig();
      provider = new ResendProvider(cfg);
      fromEmail = cfg.fromEmail || process.env.SES_FROM_EMAIL || "noreply@localhost";
      break;
    }
    case "ses":
    default: {
      const cfg = createSESProviderConfig();
      provider = new SESProvider(cfg);
      fromEmail = process.env.SES_FROM_EMAIL ||
        (process.env.NODE_ENV === "production" ? "noreply@example.com" : "noreply@localhost");
      break;
    }
  }
  return new EmailServiceImpl(provider, fromEmail);
}
```

### 5. 環境変数

`.env.example`:

```bash
EMAIL_PROVIDER=ses # ses, resend, sendgrid, etc.
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 6. 依存追加

```bash
npm install resend
```

## 実装の注意点

### Edge Runtime 対応

- Node.js 固有モジュールは dynamic import
- HTTP ベースの API を優先（Node.js ネイティブモジュール不使用のライブラリ）
- 可能なら `fetch()` で直接 API 呼び出し

### エラーハンドリング

- 常に `EmailResult` 形式で返す
- エラーは適切にログ出力し `success: false`
- ネットワーク・認証など様々なケースを考慮

### 設定の検証

```typescript
constructor(config: ResendProviderConfig) {
  if (!config.apiKey) throw new Error("Resend API key is required");
  this.config = config;
}
```

## テスト

### 単体

```typescript
describe("ResendProvider", () => {
  it("should send email successfully", async () => {
    const provider = new ResendProvider({ apiKey: "test-api-key" });
    const result = await provider.sendEmail({
      from: "test@example.com",
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });
    expect(result.success).toBe(true);
  });
});
```

### 統合

1. `.env` で `EMAIL_PROVIDER=resend`
2. パスワードリセットで実際にメール送信テスト
3. ログでメッセージ ID 確認

## 利用可能なプロバイダー例

### Edge Runtime 対応

- **Resend**: HTTP API
- **SendGrid Web API**: HTTP API
- **Postmark**: HTTP API

### Node.js Runtime のみ

- **Nodemailer**: SMTP
- **AWS SES (SDK)**: 現行実装

## 既存コードへの影響

新規プロバイダー追加で変更不要なもの：

- `EmailService` インターフェース
- `EmailServiceImpl` クラス
- 既存の `SESProvider`
- パスワードリセット機能（`auth_repository.ts`）

プロバイダー切替は `EMAIL_PROVIDER` 環境変数のみで可能。
