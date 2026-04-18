---
name: auth-implementation
description: Use when modifying Better Auth + Prisma authentication: src/libraries/auth.ts, src/libraries/auth-client.ts, src/proxy.ts, src/services/auth_service.ts, auth-related actions.ts, or prisma/schema.prisma auth models (User/Session/Account/Verification). Covers session helpers, URL/secret env resolution, DB TLS, and PUBLIC_PATHS.
---

# Auth Implementation

## Overview

認証は **Better Auth + Prisma**。UI 操作は Server Action → `AuthService` → Better Auth API の流れ。保護ページの一次ガードは `src/proxy.ts`、レイアウト単位の認可は `requireAuthSession()` / `requireAdminSession()`。正本は `docs/guides/auth.md`（DB 設計も統合済）。

## When to Use

- `src/libraries/auth.ts` / `auth-client.ts` を編集する
- `src/services/auth_service.ts` を編集する
- `src/proxy.ts` で公開パス・保護パスを変更する
- `src/hooks/useAuthSession.ts` の戻り値 shape を変える
- `prisma/schema.prisma` の `User` / `Session` / `Account` / `Verification` を変更する
- サインイン / サインアップ / 検証 / リセットの `actions.ts` を編集する

## Must-Follow Rules

1. **`permissions` は `User.permissions` に保持**（`Session` には入れない）。`auth()` / `useAuthSession()` 側で `string[]` 正規化
2. **`accessToken` / `refreshToken` / `idToken` は `Account` モデル**側に保管
3. **`useAuthSession()` の返り値に `accessToken` は含めない**
4. **公開ページ変更時は `src/proxy.ts` の `PUBLIC_PATHS` を更新**
5. **保護レイアウトでは `requireAuthSession()` / `requireAdminSession()` を使う**。ページで重複実装しない
6. **認証戻り値の shape を変えたら `jest.setup.ts` と `@/libraries/auth-client` のモックを同期**
7. **URL 解決順を守る**:
   - サーバ: `BETTER_AUTH_BASE_URL ?? APP_URL ?? NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`
   - クライアント: `NEXT_PUBLIC_BETTER_AUTH_BASE_URL ?? NEXT_PUBLIC_APP_URL`
   - Secret: `BETTER_AUTH_SECRET ?? AUTH_SECRET`

## 主要依存（現行）

- `better-auth` ^1.6.5
- `@prisma/client`, `@prisma/adapter-pg` ^7.5.0
- Prisma 生成物: `src/generated/prisma/client`（`npm run db:generate` で再生成）

## 公開ヘルパー（`src/libraries/auth.ts`）

- `getBetterAuthHandler()` — Better Auth instance
- `getHandlers()` — `/api/auth/[...all]` 用
- `auth(options)` — `getSession` ラッパー
- `signOut(options)` — サインアウト
- `requireAuthSession()` — 未認証は `/signin` へ redirect
- `requireAdminSession()` — 未認証は redirect、非 admin は `notFound()`
- `buildAppUrl()` / `buildHeaders()` — API 呼び出し補助

## ルート保護

- `src/proxy.ts` — Cookie 有無による一次ガード、`PUBLIC_PATHS`
- `src/app/(site)/(authorized)/(app)/layout.tsx` — `requireAuthSession()`
- `src/app/(site)/(authorized)/admin/layout.tsx` — `requireAdminSession()`
- `src/app/(site)/(unauthorized)/(auth)/layout.tsx` — 認証済みを `/dashboard` へ戻す（`ENABLE_AUTH_PAGE_REDIRECT=false` で無効化可）

## DB スキーマ（現行）

| モデル | 役割 | 主なフィールド |
|--------|------|--------------|
| `User` | ユーザー本体 | `email`, `permissions` (JSON array), `language`, `avatarKey`, `isActive`, `emailVerified` |
| `Session` | Better Auth セッション | `token`, `expiresAt`, `ipAddress`, `userAgent`（※ `accessToken` / `permissions` カラムは無い） |
| `Account` | 認証手段ごとの資格情報 | `providerId`, `accountId`, `password`, `accessToken`, `refreshToken`, `idToken` |
| `Verification` | Better Auth 汎用検証トークン | `identifier`, `token`, `expiresAt` |

**注意**: 現行の Prisma schema には `PasswordReset` / `EmailVerification` の独自モデルは **存在しない**（古い `.cursor/rules` 記述は無視）。

## Key Files

- `src/libraries/auth.ts` / `auth-client.ts` / `hash.ts` / `prisma.ts`
- `src/services/auth_service.ts`
- `src/proxy.ts`
- `src/hooks/useAuthSession.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/app/(site)/(unauthorized)/(auth)/**/actions.ts`
- `prisma/schema.prisma`
- `__tests__/libraries/auth.test.ts` / `__tests__/proxy.test.ts`
- `e2e/auth.spec.ts` / `email-verification.spec.ts` / `resend-verification.spec.ts`

## Reference

- **正本**: `docs/guides/auth.md`（環境変数・DB TLS・サービス責務・DB スキーマ全て統合）
- `AGENTS.md §認証`
- メール送信側の挙動: `adding-email-provider` Skill（Better Auth コールバックの smoke test）

## Checklist

- [ ] `auth.ts` の fields / additionalFields を変えたら `prisma/schema.prisma` と型を同期
- [ ] `auth-client.ts` / `useAuthSession()` の戻り値を変えたら関連テストとモックを更新
- [ ] 公開 / 保護ページを増減したら `src/proxy.ts` の `PUBLIC_PATHS` と E2E を更新
- [ ] メール検証の挙動を変えたら `ENABLE_EMAIL_VERIFICATION` の on/off 両方で動作確認
- [ ] `__tests__/libraries/auth.test.ts` / `__tests__/proxy.test.ts` を pass
- [ ] E2E (`e2e/auth.spec.ts` 等) を pass
