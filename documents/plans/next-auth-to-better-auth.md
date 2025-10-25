## NextAuthをBetterAuthに移行する

### 現状の整理
- NextAuth v5（`src/libraries/auth.ts`）で独自のCredentialsプロバイダー（`prototype` / `signin`）を定義し、`AuthService` を経由してユーザー検証とアクセストークン生成を実施している。
- サーバーサイドでは `auth()` / `signIn()` / `signOut()` を Server Components・Server Actions・middleware から直接呼び出しており、クッキー/JWTベースのセッションで利用者IDと権限配列を共有している。
- クライアント側は `src/app/providers.tsx` の `SessionProvider` 依存のみで、`useSession` 等は現状利用していない。ログイン/ログアウトは Server Action で完結。
- Prisma には NextAuth 用テーブルが存在せず、`User` / `PasswordReset` / `EmailVerification` のみを運用。セッションは DB 永続化していない。
- Jest 設定(`jest.config.js`, `jest.setup.ts`)・型拡張(`src/types/next-auth.d.ts`)・E2E(`e2e/auth.spec.ts`) が NextAuth 前提で構成されている。

### 実行計画

#### 1. 準備・方針決定
- [x] Better Auth のセッション戦略とプラグイン構成を決定し、対応する要件を整理する。  
  - 選択: Cookie キャッシュのみを採用し、セッション永続化は行わない。  
  - プラグイン: `nextCookies()` に加えて `@better-fetch/fetch` を導入し、必要に応じてカスタムストラテジーで `AuthService` 連携を行う。  
  - 要件メモ: セッション payload に `user.id` / `permissions` / `accessToken` を保持し、`AuthService` が発行するトークンと Better Auth セッションの整合性を担保する。
- [x] 必要な環境変数と命名規約を定義する。  
  - 選択: 既存の `NEXT_AUTH_*` 系キーは Better Auth に合わせてリネームし、`BETTER_AUTH_SECRET`, `BETTER_AUTH_BASE_URL` などへ統一する。  
  - 対応: `.env`, `.env.sample`, `.env.example`, `.env.docker` の各ファイルで新命名へ置き換えるタスクリストを後続ステップに反映する。
- [ ] 既存のサインイン / サインアップ / パスワードリセット / メール認証フローで保持すべき UX ・リダイレクト要件・レスポンス構造（`InvalidCredentials` など）を確認し、後続タスクで検証できるチェックポイントを用意する。  
  - 方針: `AuthService` のバリデーション／レスポンスは維持しつつ、Better Auth プロバイダー内でハンドリングする境界と UI 側のメッセージ表示仕様をドキュメント化する。

#### 2. 依存関係と型定義の更新
- [x] `package.json` / `package-lock.json` の依存整理  
  - [x] `dependencies` から `next-auth` を削除し、`better-auth`, `@better-fetch/fetch`（必要であれば `@better-auth/utils`）を追加する。  
  - [x] `npm install` を実行し、lock ファイルの更新内容を確認する。  
  - [x] `npm ls better-auth @better-fetch/fetch` などでインストール結果を検証し、CI のキャッシュ更新手順に追記する。  
  - [x] `package.json` の scripts / lint 設定に NextAuth 依存の記述が無いか洗い出し、Better Auth へ読み替える。
- [x] TypeScript 型定義の刷新  
  - [x] `src/types/next-auth.d.ts` を削除し、Better Auth 用に `src/types/auth.d.ts`（仮称）を作成する。  
  - [x] 新しい型定義でセッション payload（`user.id`, `user.permissions`, `accessToken` 等）と better-fetch のレスポンス型を宣言する。  
  - [x] `tsconfig.json` の `typeRoots` や `compilerOptions.types` を確認し、新ファイルが解決されることを確認する。  
  - [x] `jest.setup.ts` や Storybook 設定で参照している NextAuth 型を Better Auth 版に差し替える。
- [x] テスト／ビルドツールのモジュール設定更新  
  - [x] `jest.config.js` の `transformIgnorePatterns` から `next-auth` を削除し、Better Auth と better-fetch が ESM として解決されるよう設定を調整する。  
  - [x] `jest.setup.ts` 内の NextAuth モックを Better Auth のエクスポート（`auth`, `createAuthClient` など）に対応したモックへ置換する。  
  - [x] Storybook（`.storybook/main.ts`）の `viteFinal` / `webpackFinal` 設定やエイリアスに NextAuth 前提の記述が残っていないか確認し、必要があれば Better Auth 用に更新する。  
  - [x] ESLint 設定で NextAuth 向け plugin / rule が無いか見直し、不要項目を削除する。

#### 3. サーバー側 Better Auth 基盤の構築
- [x] `src/libraries/auth.ts` を Better Auth + Prisma アダプタ構成に差し替え、ユーザー／セッション／アカウント／検証トークンのテーブルマッピングとカスタムフィールド（`permissions`, `accessToken` など）を定義する。
- [x] `better-auth/next-js` の `nextCookies()` プラグインを登録し、Cookie キャッシュ設定（5分）とセッション永続化ポリシーを反映する。`@better-fetch/fetch` はクライアント統合時（Step 5）に初期化する。
- [x] `auth.api` 経由で `signIn`, `signOut`, `getSession` を提供するユーティリティ関数をエクスポートし、既存の NextAuth wrapper を置換。Better Auth のエラーを識別して `invalid_credentials` / `email_not_verified` などへ正規化するハンドラを実装した。
- [x] セッション Cookie の TTL（24時間）/ 更新タイミング（4時間）を設定し、Cookie キャッシュ運用とアクセストークン拡張フィールドの整合をドキュメント化する（`documents/plans/next-auth-to-better-auth.md` に記載済み）。

#### 4. API ルートの移行
- [x] `src/app/api/auth/[...nextauth]/route.ts` を `src/app/api/auth/[...all]/route.ts` にリネームし、Better Auth の `toNextJsHandler`（`auth.handler` または `auth` インスタンス）を利用して `GET` / `POST` をエクスポートする。
- [x] 旧ファイル参照を全て更新し、Next.js のルートキャッシュが残らないように `npm run lint` などで import エラーを検出する。

#### 5. クライアント側のセットアップ
- [x] `src/libraries/auth-client.ts` を作成し、`createAuthClient` でクライアントインスタンスを生成。`signIn`, `signOut`, `useSession` などを再エクスポートし、`baseURL` / `basePath` / `fetchOptions.credentials` など better-fetch 設定を定義する。
- [x] `src/app/providers.tsx` を Better Auth の `AuthProvider` + `NextIntlClientProvider` 構成に更新し、子ツリーへセッション状態を提供する。
- [x] クライアント側でセッションデータを参照する箇所（`HeaderUserMenu` など）を Better Auth の `useSession` ベースへ刷新し、`permissions` / `accessToken` を取得できるよう `useAuthSession` フックを追加した。

#### 6. Server Action / Repository の改修
- [x] `auth()` ユーティリティ経由で Better Auth セッションを取得するよう全体を整理し、読み取り専用箇所では `disableRefresh: true` を指定する（例: `AuthRepository.getMe`, `setLanguageAction`, `unauthorized/auth/layout.tsx`）。
- [x] `signInAction` / `signUpAction` を Better Auth 経由のセッション確立（`establishSession` + `syncCredentialAccount`）へ置換し、従来の `signIn` ヘルパーを廃止。Better Auth で発行されたセッションへ `accessToken` / `permissions` を書き戻すように調整。
- [x] `AuthRepository.getMe` を Better Auth セッション構造に沿って更新し、ユーザーIDが取得できないケースの例外処理を再検証する（テストを更新してセッション Mock を新構造に合わせた）。
- [x] ログイン直後のリダイレクトやロケール保存処理（`setLanguageAction`）でセッションが更新されることを確認し、必要に応じて `revalidatePath` のタイミングを調整する（言語更新時に `/settings` を再検証するよう対応）。
- [x] テスト群（モデル/リポジトリ/サービス）を Better Auth 用の型構造に合わせて更新し、`npm run type-check` がエラーなく完走することを確認済み。

#### 7. Middleware とルーティング保護
- [x] `src/middleware.ts` を Better Auth 推奨の実装へ改修し、`getSessionCookie` を用いて公開ページ判定とリダイレクトを制御する。
- [ ] `PUBLIC_PAGES` ロジックとリダイレクト処理が継続して機能するか E2E で検証できるようテストケースを更新する。

#### 8. Prisma / データ層の対応
- [x] Better Auth 標準スキーマに合わせて `Session` / `Account` / `Verification` モデルを Prisma へ追加し、既存 `User` モデルとのリレーションを定義する。
- [x] 生成された Prisma Client の差分を確認し、`prisma migrate dev` でマイグレーションを作成・ドキュメント化する（本番移行手順に含める）。
- [x] 既存データ（ユーザーの `permissions`, `password` など）が新しい Prisma モデルと矛盾しないことを確認し、必要であればデータ移行スクリプトを計画する。

#### 9. テスト更新
- [x] `jest.setup.ts` の NextAuth モックを削除し、Better Auth の API（`auth.api.*` やカスタムモジュール）をモックする仕組みに差し替える。
- [x] `__tests__/repositories/auth_repository.test.ts` や `__tests__/components/molecules/HeaderUserMenu.test.tsx` など、`@/libraries/auth` をモックしているテストを新しいエクスポート構造に合わせて更新する。
- [x] Playwright シナリオ（`e2e/auth.spec.ts`）を Better Auth のログインフローに追従させ、リダイレクト先やフォーム操作の期待値を見直す。

#### 10. 不要資産の整理
- [x] `src/types/next-auth.d.ts` や NextAuth 固有のユーティリティ・コメントを削除し、Better Auth 版ドキュメントへ差し替える。
- [x] `AuthError`（`next-auth` から import していたもの）に依存しているコードを `better-auth` のエラー型もしくは独自例外クラスへ置換する。
- [x] 旧 `.env` キー（例: `NEXT_AUTH_SECRET`）や README / ドキュメンテーション内の NextAuth 記述を Better Auth 向けに更新する。

#### 11. 動作確認とリリース準備
- [ ] `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build` を実行し、Better Auth への置換後も CI パイプラインが通ることを確認する。
- [ ] 実環境と同等の設定で手動QA（ログイン/ログアウト、権限判定、プロフィール更新、言語切り替え、メール認証・パスワードリセット）を実施し、問題点を洗い出す。
- [ ] リリースノート・移行手順書を作成し、必要であればステージング環境でのリグレッションテスト計画をまとめる。

### 補足
- `AuthService` がアクセストークン文字列を生成し API クライアントで Bearer 認証に利用しているため、Better Auth のセッション cookie と併せてクライアントが `accessToken` を取得できる経路（better-fetch でのヘッダー注入含む）を維持すること。
- サインアップ時にメール認証を必須とする構成では、Better Auth の `signUp` API を直接使わず既存サービスを継続利用するか、Better Auth のカスタムフローに統合するかを早期に決定する。
- Cookie キャッシュ運用のため、サーバー再起動時のセッション失効や強制ログアウト方針を運用手順としてまとめておく。
