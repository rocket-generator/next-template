# Better Auth / Prisma 更新に伴うテスト追加計画

このテンプレートリポジトリでは、直近で Better Auth 対応の整理と Prisma 7 への移行を行った。

- Better Auth 側の計画: [20260320-better-better-auth-usage.md](/Users/takaaki/Development/rocket/typescript-next-template/documents/plans/20260320-better-better-auth-usage.md)
- Prisma 側の計画: [20260321-prisma-version-up.md](/Users/takaaki/Development/rocket/typescript-next-template/documents/plans/20260321-prisma-version-up.md)

既存テストを確認したところ、UI コンポーネントと mock ベースの repository テストは一定量ある一方、今回の変更で重要になった以下の層が薄い。

- Better Auth の server helper と guard
- `AuthService` の分岐
- server actions の戻り値変換
- Prisma 7 の初期化コード
- メール認証 / パスワードリセットの実フロー
- 実 DB を通す integration / E2E

したがって本計画では、**回帰リスクの高い境界から順に** テストを追加する。

---

## 方針

- 既存 UI テストの延長ではなく、**Better Auth と Prisma 7 で壊れやすい境界**を優先する。
- 実装順は **unit → action → integration → e2e** とし、原因特定しやすい順に積む。
- 既存 E2E のような「成功でも失敗でも可」ではなく、**期待結果を一意に判定できるテスト**へ寄せる。
- 認証周りは mock のみで完結させず、最後に **実 DB + Better Auth adapter** を通す確認を入れる。

---

## 事前整理

- [x] 現状コードと既存テストを棚卸しし、未カバー領域を整理する。
- [ ] 追加するテストのレイヤ分担を確定する。
  - Jest unit: helper / service / action / repository / request schema
  - Jest integration: Prisma Client + Better Auth adapter + DB を使うフロー
  - Playwright E2E: 画面遷移とブラウザ上の認証体験
- [ ] 認証系テストデータの共通方針を決める。
  - verified user
  - unverified user
  - inactive user
  - admin user
- [ ] 必要ならテスト用 seed / fixture helper を用意し、同じ初期データを unit / integration / e2e で再利用できるようにする。

---

## 優先度 1: Better Auth 境界の unit テスト

対象:

- [src/libraries/auth.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/libraries/auth.ts)
- [src/proxy.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/proxy.ts)
- [src/hooks/useAuthSession.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/hooks/useAuthSession.ts)

追加項目:

- [x] `auth()` が `disableCookieCache` / `disableRefresh` を Better Auth に正しく伝搬することを確認する。
- [x] `auth()` が Better Auth の session shape から `user.id` / `email` / `name` / `permissions` / `expiresAt` を正しく取り出すことを確認する。
- [x] `auth()` が permissions の不正値を空配列へ正規化することを確認する。
- [x] `auth()` が未ログイン時に `null` を返すことを確認する。
- [x] `requireAuthSession()` が未認証時に `/signin` へ redirect することを確認する。
- [x] `requireAdminSession()` が admin 権限なしで `notFound()` することを確認する。
- [x] `proxy()` が public path を素通しし、private path で cookie がない場合に `/signin?callback_url=...` へ redirect することを確認する。
- [x] `useAuthSession()` が `data.user` 直下の形と `data.session.user` 配下の形の両方を扱えることを確認する。

---

## 優先度 2: AuthService の unit テスト

対象:

- [src/services/auth_service.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/services/auth_service.ts)

追加項目:

- [x] `signIn()` で `isActive=false` のユーザーを Better Auth 呼び出し前に弾くことを確認する。
- [x] `signIn()` が Better Auth の `"Email not verified"` を `email_not_verified` に変換することを確認する。
- [x] `signIn()` がそれ以外の失敗を `invalid_credentials` に変換することを確認する。
- [x] `signUp()` が `permissions`, `isActive`, `language` を含めて Better Auth へ渡すことを確認する。
- [x] `signUp()` がメール認証 ON のとき `requiresEmailVerification=true` 側へ分岐することを確認する。
- [x] `signUp()` がメール認証 OFF のとき Prisma 側で `emailVerified=true` を補正することを確認する。
- [x] `verifyEmail()` が `invalid_token` / `token_expired` を 400 系の失敗へ変換することを確認する。
- [x] `verifyEmail()` がメール認証無効時に即座に 400 を返すことを確認する。
- [x] `resendVerificationEmail()` が `"Email is already verified"` を専用メッセージへ変換することを確認する。
- [x] `forgotPassword()` が Better Auth の `requestPasswordReset` を呼ぶことを確認する。
- [x] `resetPassword()` が token と `newPassword` を Better Auth に渡すことを確認する。
- [x] `changePassword()` が `"Invalid password"` を `invalid_current_password` に変換することを確認する。
- [x] `changePassword()` が `revokeOtherSessions: true` を付与することを確認する。
- [x] `updateProfile()` が「名前だけ変更」「メールだけ変更」「変更なし」で呼び先が変わることを確認する。
- [x] `updateProfile()` がメール認証 ON のとき `changeEmail()` を呼び、OFF のとき Prisma 更新で小文字化 + `emailVerified=true` にすることを確認する。
- [x] `createUser()` が transaction 内で `users` と `accounts` を作成し、`accounts.password` にハッシュを保存することを確認する。
- [x] `updateUser()` が password ありのときだけ `accounts` を upsert し、空 password のときは account を触らないことを確認する。

---

## 優先度 3: server actions の unit テスト

対象:

- [src/app/(site)/(unauthorized)/(auth)/signin/actions.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/app/(site)/(unauthorized)/(auth)/signin/actions.ts)
- [src/app/(site)/(unauthorized)/(auth)/signup/actions.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/app/(site)/(unauthorized)/(auth)/signup/actions.ts)
- [src/app/(site)/(unauthorized)/(auth)/forgot-password/actions.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/app/(site)/(unauthorized)/(auth)/forgot-password/actions.ts)
- [src/app/(site)/(unauthorized)/(auth)/reset-password/actions.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/app/(site)/(unauthorized)/(auth)/reset-password/actions.ts)
- [src/app/(site)/(unauthorized)/(auth)/verify-email/actions.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/app/(site)/(unauthorized)/(auth)/verify-email/actions.ts)
- [src/app/(site)/(authorized)/(app)/settings/actions.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/app/(site)/(authorized)/(app)/settings/actions.ts)

追加項目:

- [x] `signInAction()` の `InvalidInput` / `InvalidCredentials` / `EmailVerificationRequired` / `Success` の分岐を確認する。
- [x] `signUpAction()` の `InvalidInput` / `InvalidCredentials` / `EmailVerificationRequired` / `Success` の分岐を確認する。
- [x] `forgotPasswordAction()` と `resetPasswordAction()` の safeParse 失敗時と成功時の戻り値を確認する。
- [x] `verifyEmailAction()` と `resendVerificationEmailAction()` の例外時フォールバックメッセージを確認する。
- [x] `updateProfile()` action が未認証を弾き、Zod エラー時に `field` を返し、成功時に `revalidatePath("/settings")` することを確認する。
- [x] `changePassword()` action が `invalid_current_password` を `currentPassword` フィールドエラーに変換することを確認する。
- [x] `uploadAvatar()` が未認証、ファイル未指定、サイズ超過、MIME 不正、成功時 URL 返却を正しく処理することを確認する。
- [x] `removeAvatar()` と `getCurrentUser()` の未認証・成功・例外時の戻り値を確認する。

---

## 優先度 4: Prisma 7 初期化コードの unit テスト

対象:

- [src/libraries/prisma.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/libraries/prisma.ts)

追加項目:

- [x] `DATABASE_URL` 未設定時に明示的なエラーを投げることを確認する。
- [x] `createPrismaClient()` が `PrismaPg` adapter を使って初期化することを確認する。
- [x] `getPrismaClient()` が開発時 singleton を再利用することを確認する。
- [x] `prisma` proxy 経由でメソッド参照しても `this` が壊れないことを確認する。

---

## 優先度 5: Email / repository / request schema の unit テスト

対象:

- [src/libraries/email.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/libraries/email.ts)
- [src/repositories/user_repository.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/repositories/user_repository.ts)
- [src/requests/signin_request.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/requests/signin_request.ts)
- [src/requests/signup_request.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/requests/signup_request.ts)
- [src/requests/forgot_password_request.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/requests/forgot_password_request.ts)
- [src/requests/reset_password_request.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/requests/reset_password_request.ts)
- [src/requests/password_change_request.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/requests/password_change_request.ts)
- [src/requests/profile_update_request.ts](/Users/takaaki/Development/rocket/typescript-next-template/src/requests/profile_update_request.ts)

追加項目:

- [x] `createSESProviderConfig()` の production / development 分岐を確認する。
- [x] `EmailServiceImpl` が verification / reset の件名・本文・送信先を正しく組み立てることを確認する。
- [x] `EmailServiceImpl` が provider failure を例外化することを確認する。
- [x] `UserRepository.getUserById()` / `updateUserData()` の基本挙動を確認する。
- [x] `UserRepository` の avatar upload / delete / signed URL / download の分岐を確認する。
- [x] sign in / sign up / forgot password / reset password / password change / profile update の各 request schema を直接テストし、実バリデーションが UI テストから独立して保証されるようにする。

---

## 優先度 6: 認証フォーム UI の unit テスト拡充

対象:

- [src/components/organisms/AuthSignupForm/index.tsx](/Users/takaaki/Development/rocket/typescript-next-template/src/components/organisms/AuthSignupForm/index.tsx)
- [src/components/organisms/AuthForgotPasswordForm/index.tsx](/Users/takaaki/Development/rocket/typescript-next-template/src/components/organisms/AuthForgotPasswordForm/index.tsx)
- [src/components/organisms/AuthResetPasswordForm/index.tsx](/Users/takaaki/Development/rocket/typescript-next-template/src/components/organisms/AuthResetPasswordForm/index.tsx)

追加項目:

- [x] `AuthSignupForm` の描画、validation、loading、submit、エラー表示を追加する。
- [x] `AuthSignupForm` で `EmailVerificationRequired` が返るケースを UI から確認できるようにする。
- [x] `AuthForgotPasswordForm` の submit、success 画面、`try again` 導線、エラー表示を追加する。
- [x] `AuthResetPasswordForm` の token なし、validation、submit、loading、エラー表示を追加する。

---

## 優先度 7: 実 DB を使う integration テスト

対象:

- Better Auth + Prisma adapter + PostgreSQL

追加項目:

- [ ] verified user で sign in でき、session を取得できることを確認する。
- [ ] unverified user は sign in 時に `email_not_verified` 扱いになることを確認する。
- [ ] verify email 実行後に `users.email_verified=true` になり、該当 verification token が消費されることを確認する。
- [ ] password reset 実行後に旧 password で sign in できず、新 password でのみ sign in できることを確認する。
- [ ] `revokeSessionsOnPasswordReset: true` により既存 session が失効することを確認する。
- [ ] admin user だけが admin guard を通ることを確認する。
- [ ] `createUser()` / `updateUser()` 経由で `accounts.password` が一貫して正しく保たれることを確認する。

---

## 優先度 8: Playwright E2E の再設計

対象:

- [e2e/auth.spec.ts](/Users/takaaki/Development/rocket/typescript-next-template/e2e/auth.spec.ts)
- [e2e/email-verification.spec.ts](/Users/takaaki/Development/rocket/typescript-next-template/e2e/email-verification.spec.ts)
- [e2e/resend-verification.spec.ts](/Users/takaaki/Development/rocket/typescript-next-template/e2e/resend-verification.spec.ts)

追加項目:

- [ ] fake token 前提や「成功でも失敗でも可」の待ち方を廃止し、seed した固定データで決定的に通る E2E へ置き換える。
- [ ] sign up → pending → resend → verify → sign in のブラウザフローを通す E2E を追加する。
- [ ] forgot password → reset password → sign in のブラウザフローを通す E2E を追加する。
- [ ] 未認証ユーザーの private page redirect と、admin 以外の admin access 拒否を E2E で確認する。
- [ ] E2E 用 seed / env / メール確認方法を README か補助ドキュメントへ追記する。

---

## 実施順の明示

以下の順に進める。

- [x] 1. Better Auth helper / guard / proxy の unit テストを追加する。
- [x] 2. `AuthService` の分岐テストを追加する。
- [x] 3. server actions の戻り値変換テストを追加する。
- [x] 4. Prisma 7 初期化コードと email service の unit テストを追加する。
- [x] 5. request schema / signup・forgot・reset form のテストを追加する。
- [ ] 6. 実 DB を使う integration テストを追加する。
- [ ] 7. Playwright E2E を決定的なフローに置き換える。

---

## 完了条件

- [ ] Better Auth まわりの主要分岐が unit テストでカバーされている。
- [ ] Prisma 7 初期化コードの回帰が unit テストで検知できる。
- [ ] メール認証 / パスワードリセット / admin guard の主要フローが integration か E2E で通る。
- [ ] 既存 E2E の曖昧な成功条件が解消されている。
- [ ] テスト追加後に `npm run test`, `npm run test:e2e`, `npm run type-check` の最低限の検証手順が文書化されている。
