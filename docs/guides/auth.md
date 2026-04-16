# 認証ガイド（Better Auth + Prisma）

## 全体像

- **Better Auth** をサーバ側に常駐させ、Prisma アダプターで PostgreSQL の `Session` / `Account` / `Verification` テーブルを管理
- ログインフォームなど UI は Server Action 経由で `AuthService`（ドメインサービス）に委譲し、アクセストークンや権限情報を Better Auth セッションに書き戻す
- クライアント側のセッション状態は `better-auth/react` クライアントをラップした `src/libraries/auth-client.ts` と `hooks/useAuthSession.ts` を使う
- API クライアントや権限チェックは `session.permissions` / `session.accessToken` を使用

## 主要依存

- `better-auth` ^1.3.29
- `@better-fetch/fetch` ^1.1.18
- `@prisma/client`, `@prisma/adapter-pg` ^7.5.0
- `pg` ^8.20.0
- `next-intl` ^4.4.0

Prisma CLI 設定は `prisma.config.ts`。生成物は `src/generated/prisma` に配置し、アプリ側は `src/generated/prisma/client` を import（`.gitignore` 対象、`npm run db:generate` で再生成）。

## ディレクトリ構造

```
src/
├── app/
│   ├── api/auth/[...all]/route.ts    # Better Auth Next.js route handler
│   ├── (site)/(unauthorized)/auth/
│   │   └── signin/actions.ts         # Server Action
│   └── middleware.ts                 # getSessionCookie() による保護
├── libraries/
│   ├── auth.ts                       # betterAuth() 設定・ヘルパー
│   ├── auth-client.ts                # better-auth/react ラッパー
│   └── hash.ts                       # PBKDF2 ハッシュ
├── hooks/useAuthSession.ts           # セッション抽出
├── services/auth_service.ts          # AuthService（DB・メール統括）
├── repositories/                     # Prisma アクセス
└── models/                           # Zod スキーマ

prisma/
├── schema.prisma
└── seed.ts
```

## 環境変数

| 変数 | 用途 | 備考 |
|------|------|------|
| `BETTER_AUTH_BASE_URL` | Better Auth の生成リンク用ベース URL | dev: `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | セッション暗号化秘密鍵 | 旧 `AUTH_SECRET` も fallback |
| `NEXT_PUBLIC_BETTER_AUTH_BASE_PATH` | クライアントからの API パス | デフォルト `/api/auth` |
| `ENABLE_EMAIL_VERIFICATION` | メール検証の有効/無効 | サインアップ動作切替 |
| `LOCALSTACK_ENDPOINT` 等 | SES/S3 エミュレーション | LocalStack 利用時 |
| `DATABASE_URL` | Postgres 接続文字列 | `sslmode` を付けると TLS 有効化（下記 DB TLS 参照） |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | CA 検証の opt-out | `false` にすると証明書検証無効（非推奨） |
| `DATABASE_SSL_CA_PATH` | CA 証明書ファイルパス | RDS 等で CA バンドルを読み込む場合に指定 |

`src/libraries/auth.ts` では `BETTER_AUTH_SECRET` → `AUTH_SECRET` の順で解決。

### DB TLS（`DATABASE_URL` の `sslmode`）

`src/libraries/prisma.ts` は DATABASE_URL の `sslmode` を以下のように解釈する。

| `sslmode` | 挙動 |
|-----------|------|
| 未指定 | TLS を有効化しない（ローカル開発向け、pg ドライバのデフォルト） |
| `disable` | 明示的に TLS オフ |
| その他（`require` 等） | TLS 有効化。既定で `rejectUnauthorized: true`（CA 検証 ON） |

`sslmode` が有効なとき、追加で以下の env を参照する。

- `DATABASE_SSL_REJECT_UNAUTHORIZED=false` → `rejectUnauthorized` を false に（中間者攻撃に弱くなるため通常は避ける）
- `DATABASE_SSL_CA` → PEM 本文を直接渡す（**Amplify / Vercel / Cloudflare 等サーバレスで推奨**。`\n` エスケープでも実改行でも可）
- `DATABASE_SSL_CA_PATH=/path/to/ca.pem` → CA ファイルパスから読み込む（Docker / VM 向け。`DATABASE_SSL_CA` が設定されていれば無視）

接続例:

```bash
# ローカル開発（Docker Compose Postgres）
DATABASE_URL="postgres://user:pass@localhost:5432/app"

# Neon / Supabase（TLS 必須、CA は公開 CA）
DATABASE_URL="postgres://user:pass@host.neon.tech/app?sslmode=require"

# AWS RDS（CA バンドル検証 / ファイル）
DATABASE_URL="postgres://user:pass@rds-host/app?sslmode=require"
DATABASE_SSL_CA_PATH=./certs/rds-ca-bundle.pem

# AWS RDS（CA バンドル検証 / env インライン）
DATABASE_URL="postgres://user:pass@rds-host/app?sslmode=require"
DATABASE_SSL_CA="-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----"
```

## サーバ実装のポイント

`src/libraries/auth.ts`:

```ts
const authInstance = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(prisma, { transaction: true, usePlural: false }),
  plugins: [nextCookies()],
  session: {
    additionalFields: {
      accessToken: { type: "string", fieldName: "accessToken", returned: true },
      permissions: { type: "json", fieldName: "permissions", returned: true, defaultValue: () => [] },
    },
    cookieCache: { enabled: true, maxAge: 60 * 5 },
    storeSessionInDatabase: true,
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 4,
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === "true",
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(password, hash),
    },
  },
});
```

### 公開ヘルパー

- `auth(options)` — `authInstance.api.getSession` のラッパー
- `signIn(options)` / `signOut()` — セッション制御
- `establishSession()` — `signInEmail` 呼び出し後、`Session` に `accessToken` / `permissions` を書き戻し
- `syncCredentialAccount()` — `Account` と `User` を同期（AuthService で生成したハッシュを保持）
- `handlers` — `/api/auth/[...all]` 用

## クライアント実装

`src/libraries/auth-client.ts` で `createAuthClient` を初期化し、`signIn`, `signOut`, `useSession` をエクスポート。サーバと同じベース URL / パスを共有する。

`hooks/useAuthSession.ts` は `useSession()` の戻り値を正規化し、`session`, `user`, `permissions`, `accessToken` をまとめて返す。

## サーバアクションのフロー

### サインイン

1. `AuthService.signIn()` で資格情報検証・アクセストークン発行
2. `syncCredentialAccount()` で `Account` を更新
3. `signIn()` で Better Auth セッション確立、`Session` に `accessToken` / `permissions` 保存
4. エラー時は `invalid_credentials` / `email_not_verified` にマップ

### サインアップ

- `AuthService.signUp()` でユーザー作成
- `ENABLE_EMAIL_VERIFICATION` が有効ならアクセストークンを返さずメール検証要求
- アクセストークンが返るケースはそのまま `signIn()`

### サインアウト

- `signOut()` が `authInstance.api.signOut` を呼び Cookie / DB セッションを無効化

## ミドルウェア

`src/middleware.ts` で `getSessionCookie()` と `auth()` を組み合わせ：

- `PUBLIC_PAGES` リストは常に許可
- 認証必須パスで未ログインならサインインへリダイレクト
- Cookie キャッシュを尊重してセッション更新を最小化

新規保護ページ追加時は `PUBLIC_PAGES` と route グループを必ず見直すこと。

## セキュリティ

- パスワードハッシュは PBKDF2 (`hash.ts`)。変更時は `verifyPassword` との整合性維持
- `Session.accessToken` は API 認証で使用。再生成時のインバリデーション方針を文書化すること
- メール検証は `EmailVerification` テーブル、Unix タイムスタンプ (`BigInt`)
- `permissions` は JSON 配列。UI 側でも `Array<string>` への正規化を忘れずに

## テスト

- `jest.setup.ts` で better-auth の主要モジュールをモック（ESM 取り込み回避）。構造変更時はモック戻り値（`useSession` の shape 等）も更新
- ユニットテストでは `@/libraries/auth` を直接モックするケース多数。新ヘルパー追加時はモックも拡張
- Playwright E2E (`e2e/auth.spec.ts`) は `/signin` → `/dashboard` フローで Cookie 検証。リダイレクト先変更時はテストも更新

## DB スキーマ全体像

`prisma/schema.prisma` で定義する主要モデル：

| モデル | 役割 | 関連 |
|--------|------|------|
| `User` | ユーザー情報の中核 | `Session`, `Account`, `PasswordReset`, `EmailVerification` |
| `Session` | Better Auth セッション | `User` |
| `Account` | プロバイダー単位のクレデンシャル（credential で PBKDF2 ハッシュ保持） | `User` |
| `Verification` | Better Auth 汎用検証トークン | なし |
| `PasswordReset` | パスワードリセットトークン（ドメイン発行） | `User` |
| `EmailVerification` | サービス独自のメール検証トークン | `User` |

### User

```prisma
model User {
  id            String   @id @default(uuid()) @db.Uuid
  name          String
  email         String   @unique
  password      String
  permissions   Json
  language      String   @default("")
  avatarKey     String?  @map("avatar_key")
  isActive      Boolean  @default(true) @map("is_active")
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  // relations...
  @@map("users")
}
```

- `permissions`: JSON 配列。Better Auth セッション書き戻し時にマージ
- `language`: UI 既定言語
- `emailVerified`: ドメイン側と Better Auth 両方で使用、ミドルウェアのアクセス制御にも関与

### Session

```prisma
model Session {
  id          String   @id @default(cuid())
  userId      String   @map("user_id") @db.Uuid
  token       String   @unique
  expiresAt   DateTime @map("expires_at")
  accessToken String?  @map("access_token")
  permissions Json?    @map("permissions")
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent")
  // ...
  @@map("sessions")
}
```

- `session.additionalFields` と同期。`accessToken` / `permissions` はサーバアクションで付与
- `cookieCache` 有効のため `updatedAt` 更新頻度に注意（`updateAge = 4h`）
- 監査ログ・IP 制限は `ipAddress` / `userAgent` を参照

### Account

```prisma
model Account {
  id                    String    @id @default(cuid())
  userId                String    @map("user_id") @db.Uuid
  providerId            String    @map("provider_id")
  accountId             String    @map("account_id")
  password              String?
  // accessToken/refreshToken/idToken, expiresAt, scope...
  @@unique([providerId, accountId])
  @@map("accounts")
}
```

- 現状は `providerId = "credential"` のみ想定、`password` に PBKDF2 ハッシュ保持
- 外部 IdP 追加時は `providerId` / `accountId` の一意制約に注意

### Verification

Better Auth 内部 API が利用する汎用トークンテーブル。アプリから直接参照することは現状なし。クリーンアップ時は `expiresAt` で削除。

### PasswordReset / EmailVerification

- `expiresAt` / `usedAt` は `BigInt`（Unix time）
- `AuthService.cleanupExpiredTokens()` で期限切れクリーンアップ
- メール検証再送・状態表示のために `EmailVerification` を `Verification` とは別に管理

### 整合性

- 全従属テーブルは `onDelete: Cascade`
- サインイン時は `AuthService.signIn()` → `establishSession()` で `Session` / `Account` 更新
- 外部プロバイダー実装時は `Account` のカラム（refresh token 等）を確認、不足ならマイグレーション

## マイグレーション運用

- `prisma/migrations/` に記録
- Better Auth 関連の変更はマイグレーションに **意図とリスク** をコメントで残す
- 本番: `prisma migrate deploy`
- ローカル: `prisma migrate dev` または `npm run docker:db:setup`

## 開発チェックリスト

1. 新フィールド追加時: `src/models/user.ts` や `AuthSchema` を同期、サーバアクション/テストの型通過確認
2. Better Auth 追加フィールド時: `Session` モデルと `session.additionalFields` の両方を更新、`jest.setup.ts` のモックも
3. 削除・データ移行時: `syncCredentialAccount()` / `AuthService` ロジックが期待通り動くか E2E (`e2e/auth.spec.ts`) で確認
