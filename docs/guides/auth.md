# 認証ガイド（Better Auth + Prisma）

## 全体像

- **Better Auth** を認証基盤として使い、Prisma adapter 経由で PostgreSQL の `User` / `Session` / `Account` / `Verification` を管理する
- UI からの認証操作は Server Action 経由で `AuthService` に委譲し、内部で Better Auth API を呼ぶ
- 保護ページの一次ガードは `src/proxy.ts`、レイアウト単位の認可は `requireAuthSession()` / `requireAdminSession()` で行う
- クライアント側では `src/libraries/auth-client.ts` と `src/hooks/useAuthSession.ts` を使ってセッション状態を扱う
- 権限情報は `Session` ではなく `User.permissions` に保持され、`auth()` / `useAuthSession()` 側で正規化して使う

## 主要依存

- `better-auth` ^1.3.29
- `@better-fetch/fetch` ^1.1.18
- `@prisma/client`, `@prisma/adapter-pg` ^7.5.0
- `pg` ^8.20.0
- `next-intl` ^4.4.0

Prisma CLI 設定は `prisma.config.ts`。生成物は `src/generated/prisma` に配置し、アプリ側は `src/generated/prisma/client` を import する。生成物はコミット対象ではなく、`npm run db:generate` で再生成する。

## ディレクトリ構造

```text
src/
├── app/
│   ├── api/auth/[...all]/route.ts      # Better Auth route handler
│   ├── (site)/(unauthorized)/(auth)/   # サインイン / サインアップ / 検証フロー
│   └── (site)/(authorized)/            # 保護済みページ群
├── proxy.ts                            # 未認証アクセスの一次ガード
├── libraries/
│   ├── auth.ts                         # betterAuth() 設定・サーバヘルパー
│   ├── auth-client.ts                  # better-auth/react ラッパー
│   ├── hash.ts                         # PBKDF2 ハッシュ
│   └── prisma.ts                       # Prisma client / DB TLS 設定
├── hooks/useAuthSession.ts             # クライアント用セッション整形
├── services/auth_service.ts            # 認証・ユーザー操作のドメインサービス
├── requests/                           # Zod request schema
└── models/                             # Zod domain/response schema

prisma/
├── schema.prisma
└── seed.ts
```

## 環境変数

| 変数 | 用途 | 備考 |
|------|------|------|
| `BETTER_AUTH_BASE_URL` | サーバ側の Better Auth ベース URL | 最優先 |
| `APP_URL` | サーバ側ベース URL の fallback | `BETTER_AUTH_BASE_URL` 未設定時 |
| `NEXT_PUBLIC_APP_URL` | サーバ / クライアント両方の fallback | ローカル既定は `http://localhost:3000` |
| `NEXT_PUBLIC_BETTER_AUTH_BASE_URL` | クライアント側ベース URL の override | `auth-client.ts` で使用 |
| `BETTER_AUTH_SECRET` | Better Auth の秘密鍵 | `AUTH_SECRET` も fallback |
| `NEXT_PUBLIC_BETTER_AUTH_BASE_PATH` | クライアントから叩く API パス | 既定 `/api/auth` |
| `ENABLE_EMAIL_VERIFICATION` | メール検証の有効 / 無効 | `true` で検証メール送信 |
| `ENABLE_AUTH_PAGE_REDIRECT` | 認証済みユーザーを auth ページから `/dashboard` へ戻すか | `false` で無効化 |
| `DATABASE_URL` | Postgres 接続文字列 | `sslmode` は下記参照 |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | TLS 証明書検証の opt-out | `false` は非推奨 |
| `DATABASE_SSL_CA_PATH` | CA 証明書ファイルパス | Docker / VM / ECS など向け |
| `DATABASE_SSL_CA` | CA 証明書本文 | env-only 環境向け override |
| `LOCALSTACK_ENDPOINT` など | SES / S3 エミュレーション | ローカル開発用 |

URL 解決順は以下。

- `src/libraries/auth.ts`: `BETTER_AUTH_BASE_URL ?? APP_URL ?? NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`
- `src/libraries/auth-client.ts`: `NEXT_PUBLIC_BETTER_AUTH_BASE_URL ?? NEXT_PUBLIC_APP_URL ?? undefined`
- secret: `BETTER_AUTH_SECRET ?? AUTH_SECRET`

### DB TLS（`DATABASE_URL` の `sslmode`）

`src/libraries/prisma.ts` は `DATABASE_URL` の `sslmode` を以下のように解釈する。

| `sslmode` | 挙動 |
|-----------|------|
| 未指定 | TLS を有効化しない |
| `disable` | 明示的に TLS オフ |
| `require` | TLS 有効化。既定で `rejectUnauthorized: true` |

`prefer` と未知の値はサポートしない。起動時エラーで止める。

`sslmode=require` のときは追加で以下を参照する。

- `DATABASE_SSL_REJECT_UNAUTHORIZED=false`
- `DATABASE_SSL_CA_PATH=/path/to/ca.pem`
- `DATABASE_SSL_CA="-----BEGIN CERTIFICATE-----\n..."`

`DATABASE_SSL_CA` がある場合は `DATABASE_SSL_CA_PATH` より優先される。

推奨設定:

- ローカル開発: `sslmode` 未指定
- Amplify: `DATABASE_SSL_CA_PATH=./certs/rds-ca-bundle.pem`
- Docker / VM / ECS / Kubernetes: `DATABASE_SSL_CA_PATH=/path/to/ca.pem`
- Vercel / Cloudflare など env-only 環境: `DATABASE_SSL_CA`

## サーバ実装のポイント

`src/libraries/auth.ts` の Better Auth 設定は以下の構成。

```ts
const authInstance = betterAuth({
  baseURL: getBaseUrl(),
  secret: getAuthSecret(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
    usePlural: false,
  }),
  plugins: [nextCookies()],
  session: {
    modelName: "session",
    fields: {
      userId: "userId",
      expiresAt: "expiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      ipAddress: "ipAddress",
      userAgent: "userAgent",
      token: "token",
    },
    cookieCache: { enabled: true, maxAge: 60 * 5 },
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 4,
  },
  user: {
    modelName: "user",
    fields: {
      emailVerified: "emailVerified",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      image: "avatarKey",
    },
    additionalFields: {
      permissions: { type: "json", fieldName: "permissions", defaultValue: () => [] },
      isActive: { type: "boolean", fieldName: "isActive", defaultValue: true },
      language: { type: "string", fieldName: "language", defaultValue: "", required: false },
    },
  },
  account: {
    modelName: "account",
    fields: {
      userId: "userId",
      providerId: "providerId",
      accountId: "accountId",
      accessToken: "accessToken",
      refreshToken: "refreshToken",
      accessTokenExpiresAt: "accessTokenExpiresAt",
      refreshTokenExpiresAt: "refreshTokenExpiresAt",
      idToken: "idToken",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      scope: "scope",
      password: "password",
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
  },
});
```

### 公開ヘルパー

- `getBetterAuthHandler()` — Better Auth instance を返す
- `getHandlers()` — `/api/auth/[...all]` 用の GET / POST handler を返す
- `auth(options)` — `authInstance.api.getSession` のラッパー
- `signOut(options)` — `authInstance.api.signOut` のラッパー
- `requireAuthSession()` — 未認証なら `/signin` へ redirect
- `requireAdminSession()` — 未認証は redirect、非 admin は `notFound()`
- `buildAppUrl()` / `buildHeaders()` — Better Auth API 呼び出し補助

## クライアント実装

`src/libraries/auth-client.ts` では `createAuthClient` を初期化し、以下を export する。

- `signIn`
- `signOut`
- `useSession`
- `authFetch`

`src/hooks/useAuthSession.ts` は `useSession()` の戻り値を正規化し、以下を返す。

- `session`
- `user`
- `permissions`
- `isPending`
- `error`
- `refetch`

`accessToken` は `useAuthSession()` の返り値には含まれない。

## `AuthService` の責務

`src/services/auth_service.ts` は Better Auth API とアプリ固有の振る舞いをまとめる。

### サインイン

1. `User.isActive` を確認
2. `authHandler.api.signInEmail()` を呼ぶ
3. Better Auth が Cookie / Session を確立
4. エラーは `invalid_credentials` / `email_not_verified` に正規化

### サインアップ

1. `authHandler.api.signUpEmail()` を呼ぶ
2. `ENABLE_EMAIL_VERIFICATION !== "true"` の場合は `user.emailVerified = true` に更新
3. `token == null` の場合はメール検証待ちとして扱う

### メール検証 / 再送

- `verifyEmail()` → `authHandler.api.verifyEmail()`
- `resendVerificationEmail()` → `authHandler.api.sendVerificationEmail()`

### パスワード再設定

- `forgotPassword()` → `authHandler.api.requestPasswordReset()`
- `resetPassword()` → `authHandler.api.resetPassword()`

### プロフィール・管理操作

- `updateProfile()` → `updateUser()` / `changeEmail()` を使い分ける
- `changePassword()` → `authHandler.api.changePassword()`
- `createUser()` / `updateUser()` → 管理画面からのユーザー作成・更新に使用する

## ルート保護

### `src/proxy.ts`

`src/proxy.ts` は `getSessionCookie()` を使い、Cookie の有無だけで未認証アクセスを弾く。

- 公開パスは `PUBLIC_PATHS` で管理
- `/data/*` と `/images/*` も公開扱い
- 保護ページに未認証で入ると `/signin?callback_url=...` に redirect

新しい公開ページを追加したら、`PUBLIC_PATHS` を更新する。

### auth ページ側のリダイレクト

`src/app/(site)/(unauthorized)/(auth)/layout.tsx` は認証済みユーザーを `/dashboard` に戻す。

- 既定では有効
- `ENABLE_AUTH_PAGE_REDIRECT=false` で無効化可能

### レイアウト側の認可

- `src/app/(site)/(authorized)/(app)/layout.tsx` → `requireAuthSession()`
- `src/app/(site)/(authorized)/admin/layout.tsx` → `requireAdminSession()`

proxy は一次ガード、レイアウトは権限チェックと必要データの読込を担当する。

## セキュリティ

- パスワードハッシュは PBKDF2（`src/libraries/hash.ts`）
- `permissions` は `User.permissions` に保持し、`auth()` / `useAuthSession()` 側で `string[]` に正規化する
- `accessToken` / `refreshToken` / `idToken` は `Account` モデル側で管理される
- メール検証や再設定トークンは Better Auth API と `Verification` テーブルを使う
- 現在の Prisma schema には `PasswordReset` / `EmailVerification` の独自モデルは存在しない

## テスト

- `__tests__/libraries/auth.test.ts` — Better Auth ラッパーとヘルパー
- `__tests__/proxy.test.ts` — `PUBLIC_PATHS` とリダイレクト挙動
- `e2e/auth.spec.ts` — サインインフロー
- `e2e/email-verification.spec.ts` / `e2e/resend-verification.spec.ts` — 検証メール周り

認証の戻り値 shape を変えたら、`jest.setup.ts` や `@/libraries/auth-client` のモックも合わせて更新する。

## DB スキーマ全体像

現在の `prisma/schema.prisma` の主要モデルは以下。

| モデル | 役割 | 主なフィールド |
|--------|------|----------------|
| `User` | アプリのユーザー本体 | `email`, `permissions`, `language`, `avatarKey`, `isActive`, `emailVerified` |
| `Session` | Better Auth セッション | `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `Account` | 認証手段ごとの資格情報 | `providerId`, `accountId`, `password`, `accessToken`, `refreshToken`, `idToken` |
| `Verification` | Better Auth の汎用検証トークン | `identifier`, `token`, `expiresAt` |

補足:

- `User.permissions` は JSON 配列
- `Session` に `accessToken` / `permissions` カラムは存在しない
- `Account.password` には credential provider 用のハッシュが入る
- `Verification` はメール検証や再設定系の内部処理で使われる

## 開発チェックリスト

1. `auth.ts` の Better Auth fields / additionalFields を変えたら、`prisma/schema.prisma` と型を同期する
2. `auth-client.ts` や `useAuthSession()` の返り値を変えたら、関連テストとモックを更新する
3. 公開 / 保護ページを増減したら、`src/proxy.ts` と E2E を更新する
4. メール検証の挙動を変えたら、`ENABLE_EMAIL_VERIFICATION` の on/off 両方を確認する
