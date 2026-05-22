
# ログインが失敗することがある

このシステムに /signin でログインする際に、正しいメールアドレスとパスワードを入力しているのに、ログインに失敗することがある。

ログを見ると以下のような物が出ている。

```
createStorageServiceInstance: StorageServiceImpl created
{
  id: '05cc2638-e734-4f00-b7f9-da77aabcf9b1',
  email: 'user_team_01@example.com',
  password: 'pbkdf2:100000:4682547109ba514fa93f8ff58eb8d591:cf4008e9c9a40dc63463f4e3ad15393dc7314f6bc1e9bd28b640575ffcb86565',
  name: 'User Name',
  permissions: [],
  isActive: true,
  emailVerified: true
}

[better-auth] syncCredentialAccount {
  userId: '05cc2638-e734-4f00-b7f9-da77aabcf9b1',
  email: 'user_team_01@example.com',
  accountFound: true,
  passwordPresent: true,
  lastUpdatedAt: 2025-12-23T06:49:46.389Z
}

signInResult { success: false, reason: 'invalid_credentials' }
```

パスワードが正しいのに、ログインに失敗するのである。何度もログインボタンを押していると、たまにログインできたりする。

原因を探り、解決して。

---

## 実装計画（ログイン失敗の断続的発生）

### 背景
- /signin で正しいメールアドレス・パスワードを入力しても `invalid_credentials` になることがある。
- ログでは `syncCredentialAccount` が成功しているのに `signInResult` が失敗し、複数回試行すると成功する。
- 現在のフローは「独自の認証（AuthService）でパスワード検証」→「Better Auth の credential アカウント同期」→「Better Auth で signInEmail」→「直後に getSession」でセッション確認、となっている。
- Better Auth の `signInEmail` はレスポンスに Set-Cookie を付与するが、同リクエスト内の `getSession` はその Cookie を参照できず `null` になりやすい（＝失敗扱い）可能性がある。

### 方針とその理由
- **方針:** `signInEmail` の戻り値に含まれる `token`（session token）を起点にセッションを取得・構築し、同一リクエスト内でセッション確定できるようにする。
  - **理由:** `signInEmail` は成功時に session token を返しているため、Cookie に依存せず DB からセッションを引ける。これにより「初回は失敗、再試行で成功」の挙動を解消できる。
- **方針:** 既存の `auth()` で行っているチーム権限の同期（`loadUserTeamContext`）は同様に実行し、セッションへ反映する。
  - **理由:** 既存の `auth()` の責務（activeTeam/permissions 同期）を保ったまま、取得経路だけを安定化する。
- **方針:** 追加のログとエラーハンドリングを入れて再発防止の観測性を高める。
  - **理由:** 現象が断続的なため、成功/失敗の境界条件を追えるようにしておく。

### 具体的なタスク
- [x] `signIn` フローの現状把握
  - [x] `src/libraries/auth.ts` の `establishSession` / `auth` の挙動を再確認し、`signInEmail` → `getSession` が同一リクエスト内でセッションを取れていない可能性を整理する。
  - [x] `node_modules/better-auth` の `signInEmail` 実装を確認し、戻り値 `token` が `session.token` であることを再確認する。
- [x] 失敗条件の再現と観測
  - [x] ローカル/検証環境で `/signin` を複数回実行し、初回失敗→再試行成功の再現性を確認する。
- [x] `signInEmail` 直後の `auth({ headers })` が `null` になる時のログを追加し、Cookie 不一致の兆候を確認する。
- [x] セッション構築の設計
  - [x] `signInEmail` の戻り値 `token` を使って `Session` を DB から取得する設計に切り替える。
  - [x] `auth()` で行っている「権限マージ」「team context 同期」の処理を流用できるよう、共通化 or 同等処理の再実装方針を決める。
- [x] 実装（`establishSession` の安定化）
  - [x] `signInEmail` の戻り値を受け取り、`token` から `prisma.session.findUnique({ where: { token } })` でセッションを取得する。
  - [x] 取得したセッションの `expiresAt` / `token` を使い `AppSession` を組み立てる。
  - [x] `loadUserTeamContext` を呼び出して `activeTeamId` と `teamPermissions` を確定し、既存の `auth()` と同様に `session` を更新する。
  - [x] 取得できない場合は、`signInEmail` が成功したかどうかの状況に応じて `invalid_credentials` / `configuration` など適切な reason を返す。
- [ ] 既存ロジックとの整合
  - [ ] `normalizeSignInError` が `signInEmail` 由来のエラー（メール未認証など）を引き続き正しく判定できるか確認する。
  - [ ] `signInAction` の返却メッセージ（`InvalidCredentials` 等）が現状通りの UX になることを確認する。
- [x] 動作確認
  - [x] 正しい認証情報で **1回目のログインが成功** することを確認する。
  - [x] 誤ったパスワードでログインすると **確実に失敗** することを確認する。
  - [x] メール未認証ユーザーでの挙動（`EmailVerificationRequired`）が維持されていることを確認する。
- [ ] 仕上げ
  - [ ] 追加したデバッグログを必要最小限に整理（本番で不要な詳細ログは削除/抑制）する。
  - [ ] 変更点の概要と再現手順、確認結果をこのドキュメントの末尾に追記する。

---

## 進捗メモ（2025-12-23）

### 実施結果
- `/signin` を Playwright で 10 回試行した結果、**全て `invalid_credentials`** となり、成功には至らなかった。
- サーバーログにて以下を確認:
  - `signInEmail` は成功し `token` を返している
  - 直後の `auth({ headers })` が `null` となり、`signInResult` が `invalid_credentials` に落ちている
- 修正後、`/signin` を Playwright で 5 回試行し、**全て成功**（`/dashboard` へ遷移）することを確認した。
- 誤ったパスワードでは `メールアドレスまたはパスワードが不正です` が表示され、ログイン失敗を確認した（修正後も同様）。
- 未認証ユーザー（`unverified@example.com` / `password`）で `/verify-email/pending` に遷移することを確認した。
- 検証のため `unverified@example.com` をテスト用に DB へ追加した。
- `e2e/auth.spec.ts` の期待URLと送信ボタンのセレクタを現状に合わせて更新し、Playwright 実行が成功した。
- `__tests__/services/auth_service.test.ts` は `next-intl/server` のモックを追加して通過することを確認した。
- テスト用に追加した `unverified@example.com` は削除済み。

### 進捗チェック
- [x] ローカル/検証環境で `/signin` を複数回実行し、再現性を確認（**今回の環境では常に失敗**）
- [x] `signInEmail` 直後に `auth({ headers })` が `null` になるログを確認
- [x] 誤ったパスワードでのログイン失敗を確認
- [x] 未認証ユーザーでのログイン挙動を確認

### 設計メモ（セッション構築の方針決定）
- `signInEmail` 成功時に返ってくる `token` を **cookie ではなく DB 参照のキー** として利用する。
- `prisma.session.findUnique({ where: { token } })` で `Session` を取得し、同時に `User` も取得して `AppSession` を組み立てる。
- `auth()` と同じ責務（権限マージ / team context 同期）を **establishSession 内で再現**する。
  - `loadUserTeamContext(userId, { preferTeamId: session.activeTeamId ?? null })` を呼び出し、`activeTeamId` / `teamPermissions` / `memberships` を確定する。
  - 変化がある場合は `prisma.session.update` で `activeTeamId` と `teamPermissions` を更新する。
- `accessToken` / `permissions` は `signIn` の引数から `Session` に保存し、同時に `AppSession` へ反映する。
- `Session` が取得できない場合はログを残し、`configuration` などの適切な reason で失敗扱いにする。
- DB 反映のタイミング差異に備えて **短いリトライ（数回・数十ms）** を検討する。

---

## 変更差分

```diff
diff --git a/__tests__/services/auth_service.test.ts b/__tests__/services/auth_service.test.ts
index 492311f..c38ddb9 100644
--- a/__tests__/services/auth_service.test.ts
+++ b/__tests__/services/auth_service.test.ts
@@ -1,4 +1,4 @@
-import { AuthService } from "@/services/auth_service";
+import { AuthService, EmailNotVerifiedError } from "@/services/auth_service";
 import { AuthRepositoryInterface } from "@/repositories/auth_repository";
 import { PasswordResetRepository } from "@/repositories/password_reset_repository";
 import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
@@ -176,7 +176,7 @@ describe("AuthService", () => {
       mockVerifyPassword.mockResolvedValue(true);
 
       await expect(authService.signIn(request)).rejects.toThrow(
-        "Email not verified. Please check your email and verify your account."
+        EmailNotVerifiedError
       );
 
       // Clean up
diff --git a/e2e/auth.spec.ts b/e2e/auth.spec.ts
index 894f7d0..da1f3e4 100644
--- a/e2e/auth.spec.ts
+++ b/e2e/auth.spec.ts
@@ -13,17 +13,17 @@ test.describe('認証機能', () => {
   test('/signin でサインインフォームが表示される', async ({ page }) => {
     await page.goto('/signin');
 
-    await expect(page).toHaveURL(/\/auth\/signin$/);
+    await expect(page).toHaveURL(/\/signin$/);
 
     await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
     await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
-    await expect(page.locator('[data-testid="signin-submit-button"]')).toBeVisible();
+    await expect(page.locator('button[type="submit"]')).toBeVisible();
   });
 
   test('admin@example.com / password でダッシュボードに遷移する', async ({ page }) => {
     await page.goto('/signin');
 
-    await expect(page).toHaveURL(/\/auth\/signin$/);
+    await expect(page).toHaveURL(/\/signin$/);
 
     await page.fill('[data-testid="email-input"]', 'admin@example.com');
     await page.fill('[data-testid="password-input"]', 'password');
@@ -32,10 +32,10 @@ test.describe('認証機能', () => {
       page.waitForURL((url) => url.pathname !== '/signin', {
         timeout: 10000,
       }),
-      page.click('[data-testid="signin-submit-button"]'),
+      page.click('button[type="submit"]'),
     ]);
 
     await expect(page).toHaveURL(/\/dashboard$/);
-    await expect(page.locator('body')).toContainText('Dashboard');
+    await expect(page.locator('body')).toContainText('カメラ');
   });
 });
diff --git a/jest.config.js b/jest.config.js
index c05a260..d75dc77 100644
--- a/jest.config.js
+++ b/jest.config.js
@@ -13,6 +13,7 @@ const config = {
   setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
   moduleNameMapper: {
     "^@/(.*)$": "<rootDir>/src/$1",
+    "^next-intl/server$": "<rootDir>/__mocks__/next-intl-server.js",
   },
   collectCoverage: true,
   coverageDirectory: "coverage",
@@ -26,7 +27,7 @@ const config = {
   watchPathIgnorePatterns: ["<rootDir>/.next/"],
   // ESM モジュールの変換を設定
   transformIgnorePatterns: [
-    "node_modules/(?!(better-auth|@better-fetch/fetch)/)"
+    "node_modules/(?!(better-auth|@better-fetch/fetch|next-intl)/)"
   ],
   // ESM サポートを有効化
   extensionsToTreatAsEsm: [".ts", ".tsx"],
diff --git a/src/app/(site)/(unauthorized)/(auth)/signin/actions.ts b/src/app/(site)/(unauthorized)/(auth)/signin/actions.ts
index 2854651..e61bea4 100644
--- a/src/app/(site)/(unauthorized)/(auth)/signin/actions.ts
+++ b/src/app/(site)/(unauthorized)/(auth)/signin/actions.ts
@@ -11,7 +11,7 @@ import {
 import { UserRepository } from "@/repositories/user_repository";
 import { PasswordResetRepository } from "@/repositories/password_reset_repository";
 import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
-import { AuthService } from "@/services/auth_service";
+import { AuthService, EmailNotVerifiedError } from "@/services/auth_service";
 
 export async function signInAction(
   rawInput: SignInRequest
@@ -64,6 +64,9 @@ export async function signInAction(
 
     return InvalidCredentials;
   } catch (error) {
+    if (error instanceof EmailNotVerifiedError) {
+      return EmailVerificationRequired;
+    }
     console.error("Sign in error:", error);
     // 予期せぬエラーの場合も InvalidCredentials を返す
     return InvalidCredentials;
diff --git a/src/app/(site)/(unauthorized)/(auth)/signin/page.tsx b/src/app/(site)/(unauthorized)/(auth)/signin/page.tsx
index 3416e41..4906f90 100644
--- a/src/app/(site)/(unauthorized)/(auth)/signin/page.tsx
+++ b/src/app/(site)/(unauthorized)/(auth)/signin/page.tsx
@@ -2,7 +2,7 @@ import AuthSigninForm from "@/components/organisms/AuthSigninForm";
 import { redirect } from "next/navigation";
 import { signInAction } from "./actions";
 import { SignInRequest } from "@/requests/signin_request";
-import { Success } from "@/constants/auth";
+import { Success, EmailVerificationRequired } from "@/constants/auth";
 
 interface SignInPageProps {
   searchParams: Promise<{ callback_url?: string }>;
@@ -21,6 +21,8 @@ export default async function SignInPage({ searchParams }: SignInPageProps) {
       } else {
         redirect("/dashboard");
       }
+    } else if (result === EmailVerificationRequired) {
+      redirect("/verify-email/pending");
     }
     return result;
   };
diff --git a/src/components/organisms/AuthSigninForm/index.tsx b/src/components/organisms/AuthSigninForm/index.tsx
index c7b4247..c24cf17 100644
--- a/src/components/organisms/AuthSigninForm/index.tsx
+++ b/src/components/organisms/AuthSigninForm/index.tsx
@@ -147,7 +147,12 @@ export default function AuthSigninForm({ onSubmit }: AuthSigninFormProps) {
           </Link>
         </div>
 
-        <Button type="submit" className="w-full" disabled={isLoading}>
+        <Button
+          type="submit"
+          className="w-full"
+          disabled={isLoading}
+          data-testid="signin-submit-button"
+        >
           {isLoading ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
diff --git a/src/libraries/auth.ts b/src/libraries/auth.ts
index 44fbe59..3cb1cd4 100644
--- a/src/libraries/auth.ts
+++ b/src/libraries/auth.ts
@@ -410,6 +410,12 @@ function mapErrorMessage(message: string): SignInErrorCode {
   if (upper.includes("EMAIL AND PASSWORD IS NOT ENABLED")) {
     return "configuration";
   }
+  if (
+    upper.includes("FAILED_TO_GET_SESSION") ||
+    upper.includes("SESSION_NOT_FOUND")
+  ) {
+    return "configuration";
+  }
   if (
     upper.includes("TEAM_NOT_ASSIGNED") ||
     upper.includes("TEAM_MEMBERSHIP_NOT_FOUND")
@@ -562,12 +568,31 @@ export async function syncCredentialAccount(params: {
   });
 }
 
+async function findSessionByToken(
+  token: string,
+  attempts: number = 3,
+  delayMs: number = 50
+) {
+  for (let attempt = 0; attempt < attempts; attempt += 1) {
+    const session = await prisma.session.findUnique({
+      where: { token },
+    });
+    if (session) {
+      return session;
+    }
+    if (attempt < attempts - 1) {
+      await new Promise((resolve) => setTimeout(resolve, delayMs));
+    }
+  }
+  return null;
+}
+
 export async function establishSession(
   options: EstablishSessionOptions
 ): Promise<AppSession | null> {
   const headers = await buildHeaders(options.headers);
 
-  await ensureAuthInstance().api.signInEmail({
+  const signInResponse = await ensureAuthInstance().api.signInEmail({
     headers,
     body: {
       email: options.email,
@@ -576,30 +601,101 @@ export async function establishSession(
     },
   });
 
-  const session = await auth({ headers });
-  if (!session) {
-    return null;
+  const sessionToken = signInResponse?.token;
+  if (!sessionToken) {
+    console.warn("[better-auth] signInEmail response missing token", {
+      userId: signInResponse?.user?.id,
+      email: options.email,
+    });
+    throw new Error("FAILED_TO_GET_SESSION");
   }
 
-  if (!session.memberships || session.memberships.length === 0) {
-    throw new MissingTeamMembershipError();
+  const sessionRecord = await findSessionByToken(sessionToken);
+  if (!sessionRecord) {
+    console.warn("[better-auth] session not found after signInEmail", {
+      token: sessionToken,
+      userId: signInResponse?.user?.id,
+    });
+    throw new Error("SESSION_NOT_FOUND");
   }
 
-  if (session.sessionToken) {
-    try {
-      await prisma.session.update({
-        where: { token: session.sessionToken },
-        data: {
-          accessToken: options.accessToken ?? null,
-          permissions: options.permissions ?? [],
-          activeTeamId: session.activeTeamId ?? null,
-          teamPermissions: session.teamPermissions ?? [],
-        },
-      });
-    } catch (error) {
-      console.error("Failed to persist session metadata", error);
+  const userRecord = await prisma.user.findUnique({
+    where: { id: sessionRecord.userId },
+    select: {
+      id: true,
+      email: true,
+      name: true,
+      permissions: true,
+    },
+  });
+
+  if (!userRecord) {
+    console.warn("[better-auth] user not found for session", {
+      userId: sessionRecord.userId,
+      token: sessionToken,
+    });
+    throw new Error("USER_NOT_FOUND");
+  }
+
+  const sessionPermissions = normalizeStringArray(options.permissions ?? []);
+  const userPermissions = normalizeStringArray(userRecord.permissions);
+  const combinedPermissions = Array.from(
+    new Set([...sessionPermissions, ...userPermissions])
+  );
+
+  let activeTeamId: string | null = sessionRecord.activeTeamId ?? null;
+  let teamPermissions = normalizeStringArray(sessionRecord.teamPermissions);
+  let memberships: TeamMembershipSummary[] = [];
+
+  try {
+    const context: TeamContext = await loadUserTeamContext(userRecord.id, {
+      preferTeamId: activeTeamId,
+    });
+    activeTeamId = context.activeTeamId;
+    teamPermissions = context.teamPermissions;
+    memberships = context.memberships;
+  } catch (error) {
+    if (error instanceof MissingTeamMembershipError) {
+      activeTeamId = null;
+      teamPermissions = [];
+      memberships = [];
+    } else {
+      console.error("Failed to load user team context", error);
     }
   }
 
+  if (!memberships || memberships.length === 0) {
+    throw new MissingTeamMembershipError();
+  }
+
+  const session: AppSession = {
+    user: {
+      id: userRecord.id,
+      email: userRecord.email ?? undefined,
+      name: userRecord.name ?? undefined,
+      permissions: combinedPermissions,
+    },
+    accessToken: options.accessToken ?? sessionRecord.accessToken ?? undefined,
+    expiresAt: sessionRecord.expiresAt,
+    sessionToken: sessionRecord.token,
+    activeTeamId,
+    teamPermissions,
+    memberships,
+  };
+
+  try {
+    await prisma.session.update({
+      where: { token: sessionRecord.token },
+      data: {
+        accessToken: options.accessToken ?? null,
+        permissions: options.permissions ?? [],
+        activeTeamId,
+        teamPermissions,
+      },
+    });
+  } catch (error) {
+    console.error("Failed to persist session metadata", error);
+  }
+
   return session;
 }
diff --git a/src/services/auth_service.ts b/src/services/auth_service.ts
index 5ea9d7e..869015a 100644
--- a/src/services/auth_service.ts
+++ b/src/services/auth_service.ts
@@ -21,6 +21,15 @@ import { PasswordReset } from "@/models/password_reset";
 import { EmailVerification } from "@/models/email_verification";
 import { getTranslations } from "next-intl/server";
 
+export class EmailNotVerifiedError extends Error {
+  constructor(
+    message: string = "Email not verified. Please check your email and verify your account."
+  ) {
+    super(message);
+    this.name = "EmailNotVerifiedError";
+  }
+}
+
 export class AuthService {
   constructor(
     private authRepository: AuthRepositoryInterface,
@@ -61,9 +70,7 @@ export class AuthService {
     // Check email verification if enabled
     console.log(user);
     if (this.isEmailVerificationEnabled() && !user.emailVerified) {
-      throw new Error(
-        "Email not verified. Please check your email and verify your account."
-      );
+      throw new EmailNotVerifiedError();
     }
 
     // Generate access token
```
