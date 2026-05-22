# 認証の問題を解決しよう

このプロジェクトはNextのテンプレートなのだが、このテンプレートを使って作ったプロジェクトで、正しいメールアドレスとパスワードを入力してもログインに失敗する問題があり、調査、修正した。

その時の作業ログとコードのdiffを以下のファイルに保存してある。

documents/references/20251223-reference-auth-update.md

この作業を行ったプロジェクトは、本リポジトリをベースとしているので、基本的に構造は全く同じであり、本リポジトリも同じ問題を抱えているはずである。

この `20251223-reference-auth-update.md` の内容を精査し、本リポジトリでも同様に問題を解決してください。



---

## 実装計画（2025-12-24）

### 背景
- 本リポジトリの `src/libraries/auth.ts` は `signInEmail` の直後に `auth({ headers })` でセッションを取得しており、同一リクエスト内で Cookie が参照できず `null` になる可能性がある。
- 参照ログ（`documents/references/20251223-reference-auth-update.md`）では同現象が発生しており、`signInEmail` の戻り値 `token` を使った DB 参照に切り替えることで安定化している。
- 本リポジトリも同様の構成のため、セッション取得経路の見直しとエラー伝播の整理が必要。

### 方針とその理由
- **方針:** `signInEmail` の戻り値 `token` を起点に `Session` を DB から取得し、Cookie 依存を排除する。
  - **理由:** 同一リクエスト内で Cookie が反映されない問題を回避し、初回ログイン失敗を解消するため。
- **方針:** セッション取得は短いリトライを入れて DB 反映タイミング差を吸収する。
  - **理由:** `signInEmail` 直後はレコード生成のタイミング差が出る可能性があるため。
- **方針:** `AuthService` のメール未認証エラーを型付きで扱い、UI 側で適切に遷移させる。
  - **理由:** 例外が汎用エラーとして握りつぶされると `EmailVerificationRequired` へ誘導できず UX が悪化するため。
- **方針:** 既存テスト（Jest / Playwright）を現状 UI と認証フローに合わせて更新する。
  - **理由:** 実装変更後の回帰を防ぎ、ログイン成功/失敗の期待値を明確にするため。

### 具体的なタスク
- [x] 現状調査と影響範囲の整理
- [x] `src/libraries/auth.ts` の `establishSession` / `signIn` / `mapErrorMessage` の現状フローを確認し、Cookie 依存箇所を明確化する。
- [x] `prisma/schema.prisma` の `Session` / `User` カラム（`token`, `accessToken`, `permissions`）を確認し、DB 参照で必要なフィールドを洗い出す。
- [x] `src/app/(site)/(unauthorized)/(auth)/signin/actions.ts` と `src/app/(site)/(unauthorized)/(auth)/signin/page.tsx` のエラー遷移（メール未認証）現状を確認する。
- [x] `e2e/auth.spec.ts` と `__tests__/services/auth_service.test.ts` の期待値（URL, 文言, エラー型）を確認する。

- [x] `establishSession` の安定化（DB 参照に切り替え）
- [x] `src/libraries/auth.ts` に `findSessionByToken(token, attempts, delayMs)` を追加し、`prisma.session.findUnique` を短いリトライ付きで実行する。
- [x] `signInEmail` の戻り値から `token` を取得し、未取得の場合は `FAILED_TO_GET_SESSION` を投げる。
- [x] 取得した `token` で `Session` を取得できない場合は `SESSION_NOT_FOUND` を投げる。
- [x] `Session` から `userId` を使って `User` を取得し、未取得の場合は `USER_NOT_FOUND` を投げる。
- [x] `options.permissions` と `user.permissions` を正規化してマージし、`AppSession` を組み立てる（`accessToken`, `expiresAt`, `sessionToken` を含む）。
- [x] `prisma.session.update` で `accessToken` / `permissions` を保存し、ログイン後のセッションメタデータを同期する。
- [x] `mapErrorMessage` に `FAILED_TO_GET_SESSION` / `SESSION_NOT_FOUND` / `USER_NOT_FOUND` を `configuration` として扱う分岐を追加する。
- [x] 失敗時の `console.warn` / `console.error` を整理し、デバッグに必要な最小限の情報（token, userId）だけを残す。

- [x] メール未認証エラーの型付けと遷移改善
- [x] `src/services/auth_service.ts` に `EmailNotVerifiedError` を追加し、未認証時はこのエラーを投げるように修正する。
- [x] `src/app/(site)/(unauthorized)/(auth)/signin/actions.ts` で `EmailNotVerifiedError` を捕捉し `EmailVerificationRequired` を返すようにする。
- [x] `src/app/(site)/(unauthorized)/(auth)/signin/page.tsx` で `EmailVerificationRequired` を受け取った場合 `/verify-email/pending` にリダイレクトする。

- [ ] テストと検証
- [x] `__tests__/services/auth_service.test.ts` の未認証テストを `EmailNotVerifiedError` に合わせて更新する。
- [x] `jest.config.js` に `next-intl/server` の ESM 対応が不足している場合、`__mocks__/next-intl-server.js` の追加と `moduleNameMapper` / `transformIgnorePatterns` の更新を行う。
- [x] `e2e/auth.spec.ts` の `/signin` URL と送信ボタンセレクタを実装に合わせて更新し、ダッシュボード文言は `src/app/(site)/(authorized)/(app)/dashboard/page.tsx` の表示内容に合わせる。
- [ ] ローカルで `/signin` を複数回試行し、初回から成功すること／誤パスワードで確実に失敗すること／未認証ユーザーで `/verify-email/pending` へ遷移することを確認する。
- [ ] 追加したログの整理（不要な詳細ログの削除）と、変更内容の簡単な検証メモを本ドキュメント末尾に追記する。
