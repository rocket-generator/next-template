---
name: email-provider
description: Use when changing this template's mail delivery backend, reviewing email env setup, switching between `ses` and `smtp`, or adding a new provider such as Resend, SendGrid, Postmark, or Mailgun. Covers EMAIL_PROVIDER routing, EMAIL_FROM priority, dynamic import for Node-only SDKs, and test coverage for both email.test.ts and Better Auth callback smoke.
---

# Email Provider

Read [`docs/guides/email-provider.md`](../../../docs/guides/email-provider.md) first — it is the authoritative source.

## Current State

- Implemented providers: `ses`, `smtp`
- Provider selection: `EMAIL_PROVIDER`
- Sender address resolution is provider-agnostic:
  - prefer `EMAIL_FROM`
  - fallback `SES_FROM_EMAIL` with deprecation warning
- SES credentials use `SYSTEM_AWS_*`

## Current Env Map

### `ses`

- `EMAIL_PROVIDER=ses`
- `SYSTEM_AWS_SES_REGION`
- `SYSTEM_AWS_ACCESS_KEY_ID`
- `SYSTEM_AWS_SECRET_ACCESS_KEY`
- `LOCALSTACK_ENDPOINT`
- `EMAIL_FROM`

### `smtp`

- `EMAIL_PROVIDER=smtp`
- `SMTP_HOST`
- `SMTP_PORT`（未設定時は `587`）
- `SMTP_SECURE`（`"true"` / `"false"` のみ）
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

## Must-Follow Rules

1. **`EMAIL_FROM` を送信元の正本とする**。`SES_FROM_EMAIL` は deprecated fallback のみ。新しい provider 名入り env を増やさない
2. **不正な `EMAIL_PROVIDER` は silent fallback せず throw**（例: `Unknown EMAIL_PROVIDER: ${name}`）
3. **Node.js SDK は `await import()` で動的読込**（エッジランタイム対策）
4. **失敗は `EmailResult` 形式で返す**。呼出側で明示的に扱わせる
5. **`SYSTEM_AWS_*` 命名を維持**（`AWS_*` は使わない）
6. **`EmailProvider` / `EmailService` の契約は可能な限り安定**させる

## Workflow

1. `src/libraries/email.ts` を確認し、`EmailProvider` / `EmailService` 契約を破らないか判断する
2. 新しい provider を追加する場合：
   - provider config interface を追加
   - provider class を追加
   - env loader / validation を追加
   - `createEmailServiceInstance()` の `switch` を拡張
3. 送信元解決は provider-agnostic のまま維持する。新 provider 専用の送信元 env を追加しない
4. 設定 / ドキュメントを更新：
   - `.env.example`
   - `README.md`
   - `docs/guides/email-provider.md`
5. テストを更新：
   - `__tests__/libraries/email.test.ts`
   - `__tests__/libraries/auth.test.ts`（Better Auth コールバック smoke）

## Key Files

- `src/libraries/email.ts` — 実装本体（`EmailService` / `EmailProvider` / `SESProvider` / `SMTPProvider` / `EmailServiceImpl` / `createXxxProviderConfig()` / `createEmailServiceInstance()`）
- `src/libraries/auth.ts` — consumer wiring（変更時）
- `.env.example` — env 追記
- `__tests__/libraries/email.test.ts` — プロバイダー選択・env validation・`EMAIL_FROM` 優先・throw
- `__tests__/libraries/auth.test.ts` — Better Auth の reset / verification コールバック smoke
- `README.md` / `docs/guides/email-provider.md`

## Quick Decisions

- SES on LocalStack: `EMAIL_PROVIDER=ses` + `LOCALSTACK_ENDPOINT`
- Mailhog / Mailtrap / 汎用 SMTP relay: `EMAIL_PROVIDER=smtp`
- Resend / SendGrid / Postmark: 通常は専用 provider を追加
- HTML メール文面そのものの改善は backend 切替とは別タスク（該当 skill があればそちら）

## Reference

- **正本**: `docs/guides/email-provider.md`
- `AGENTS.md §メールプロバイダー追加`
- 関連 skill: `storage-provider`, `auth-implementation`

## Checklist

- [ ] `EmailProvider` interface を満たす class を追加
- [ ] `createXxxProviderConfig()` を追加（env からの生成 + validation）
- [ ] `createEmailServiceInstance()` の `switch` に分岐を追加
- [ ] `.env.example` を更新
- [ ] `__tests__/libraries/email.test.ts` にプロバイダー選択・env validation・throw を追加
- [ ] `__tests__/libraries/auth.test.ts` の reset / verification smoke を通す
- [ ] `README.md` / `docs/guides/email-provider.md` を更新
