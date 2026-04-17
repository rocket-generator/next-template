# メールプロバイダー追加ガイド

既存のメールサービスに新しいプロバイダーを追加する方法。

## 現在の実装状況

現時点で `src/libraries/email.ts` に実装済みなのは以下です。

- `EmailService`
- `EmailProvider`
- `SESProvider`
- `SMTPProvider`
- `EmailServiceImpl`
- `createSESProviderConfig()`
- `createSMTPProviderConfig()`
- `createEmailServiceInstance()` は `EMAIL_PROVIDER=ses|smtp` で切り替え

送信元アドレスは provider 非依存の `EMAIL_FROM` を優先し、`SES_FROM_EMAIL` は後方互換のため deprecated fallback として残しています。

## 現在の環境変数

### SES

```bash
EMAIL_PROVIDER=ses
SYSTEM_AWS_SES_REGION=us-east-1
SYSTEM_AWS_ACCESS_KEY_ID=your-access-key
SYSTEM_AWS_SECRET_ACCESS_KEY=your-secret-key
LOCALSTACK_ENDPOINT=http://localhost:4566
EMAIL_FROM=noreply@yourdomain.com
SES_FROM_EMAIL=noreply@yourdomain.com # deprecated
```

### SMTP

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=smtp-user
SMTP_PASS=smtp-pass
EMAIL_FROM=noreply@yourdomain.com
```

## 追加手順

### 1. 設定インターフェース

```typescript
export interface ResendProviderConfig {
  apiKey: string;
}
```

### 2. プロバイダークラス

```typescript
export class ResendProvider implements EmailProvider {
  constructor(private config: ResendProviderConfig) {
    if (!config.apiKey) {
      throw new Error("Resend API key is required");
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(this.config.apiKey);
      const result = await resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
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
  };
}
```

### 4. メインファクトリー更新

```typescript
export function createEmailServiceInstance(): EmailService {
  const providerName = process.env.EMAIL_PROVIDER ?? "ses";
  const fromEmail = resolveFromEmail();

  switch (providerName) {
    case "resend":
      return new EmailServiceImpl(
        new ResendProvider(createResendProviderConfig()),
        fromEmail
      );
    case "smtp":
      return new EmailServiceImpl(
        new SMTPProvider(createSMTPProviderConfig()),
        fromEmail
      );
    case "ses":
      return new EmailServiceImpl(
        new SESProvider(createSESProviderConfig()),
        fromEmail
      );
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: ${providerName}`);
  }
}
```

## 実装の注意点

- `EMAIL_FROM` を基準にする。新 provider を追加しても provider 名入り env を増やさない。
- `SES_FROM_EMAIL` は後方互換専用。新規ドキュメントやサンプルでは使わない。
- Node.js 専用 SDK やクライアントは `await import()` で読む。
- エラーは必ず `EmailResult` に詰めて返す。
- typo や不正 provider 名は silent fallback させずに throw する。

## テスト

最低でも以下を追加・更新する。

- `__tests__/libraries/email.test.ts`
  - `EMAIL_PROVIDER=smtp` で SMTPProvider が使われる
  - `SYSTEM_AWS_*` で SES 設定が生成される
  - `EMAIL_FROM` 優先 / `SES_FROM_EMAIL` fallback / デフォルト送信元
  - 不正 provider 名で throw
- `__tests__/libraries/auth.test.ts`
  - Better Auth の reset / verification コールバックが切替後 provider を通って動く

## 利用可能なプロバイダー例

- Node.js runtime:
  - AWS SES
  - SMTP / Mailhog / Mailtrap
  - Resend
  - SendGrid
- HTTP API ベース:
  - Resend
  - Postmark
  - SendGrid Web API

プロバイダー切り替えは `EMAIL_PROVIDER` の設定のみで可能です。
