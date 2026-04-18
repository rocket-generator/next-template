---
name: adding-email-provider
description: Use when modifying src/libraries/email.ts, adding a new EmailProvider implementation, or changing EMAIL_PROVIDER environment variables. Covers SES/SMTP patterns, Node.js dynamic import, EMAIL_FROM priority, and required tests for email.test.ts and auth.test.ts.
---

# Adding Email Provider

## Overview

メール送信層 (`src/libraries/email.ts`) に新しい `EmailProvider` を追加・変更するときに使う。正本は `docs/guides/email-provider.md`。

## When to Use

- `src/libraries/email.ts` を編集する
- 新しいメールプロバイダー（Resend / Postmark / SendGrid 等）を追加する
- `EMAIL_PROVIDER` の値を増やす
- SES / SMTP の設定ロジックを変える

**When NOT to use**: Better Auth のコールバック側（検証メール・パスワードリセット）を触るだけなら `auth-implementation`。

## Must-Follow Rules

1. **`EMAIL_FROM` を送信元の正本とする**。`SES_FROM_EMAIL` は deprecated fallback のみ。新しい provider 名入り env を増やさない
2. **不正な `EMAIL_PROVIDER` は silent fallback せず throw**（例: `Unknown EMAIL_PROVIDER: ${name}`）
3. **Node.js SDK は `await import()` で動的読込**（エッジランタイム対策）
4. **失敗は `EmailResult` 形式で返す**。呼出側で明示的に扱わせる
5. **`SYSTEM_AWS_*` 命名を維持**（`AWS_*` は使わない）

## Key Files

- `src/libraries/email.ts` — 実装（`EmailService` / `EmailProvider` / `SESProvider` / `SMTPProvider` / `EmailServiceImpl` / `createEmailServiceInstance`）
- `.env.example` — env 追記先
- `__tests__/libraries/email.test.ts` — プロバイダー選択・env validation・`EMAIL_FROM` 優先・不正値 throw のテスト
- `__tests__/libraries/auth.test.ts` — Better Auth の reset / verification コールバック smoke
- `README.md` / `docs/guides/email-provider.md` — ドキュメント更新

## Reference

- **正本**: `docs/guides/email-provider.md`
- 実装例（Resend 追加手順）: `docs/guides/email-provider.md §追加手順`
- `AGENTS.md §メールプロバイダー追加`

## Checklist

- [ ] `StorageProvider` ならぬ `EmailProvider` interface を満たす class を追加
- [ ] `createXxxProviderConfig()` を追加（env からの生成）
- [ ] `createEmailServiceInstance()` の `switch` に分岐を追加
- [ ] `.env.example` を更新
- [ ] `__tests__/libraries/email.test.ts` にプロバイダー選択・env validation・throw を追加
- [ ] `__tests__/libraries/auth.test.ts` の reset / verification smoke を通す
- [ ] `README.md` / `docs/guides/email-provider.md` を更新
