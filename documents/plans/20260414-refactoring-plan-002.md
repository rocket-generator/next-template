# リファクタリング計画 002: セキュリティヘッダの付与

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の重大 §2
作成日: 2026-04-16

---

## 背景

`next.config.ts:1-48` には `headers()` 定義が無く、`src/proxy.ts` でもレスポンスヘッダを付与していない。

- Amplify Hosting の SSR Compute は既定でセキュリティヘッダを自動付与しない
- Vercel も Next.js が返すヘッダ以外を自動追加しない
- その結果、派生する全サイトが CSP / HSTS / X-Frame-Options / Referrer-Policy 等ゼロの状態で出発することになる

テンプレートとして、最低限の共通ヘッダはコミットしておくべき。

CSP の厳格さは「緩め」とする（ユーザー判断済）:

- `'unsafe-inline'` / `'unsafe-eval'` は許可（Next.js のインラインスクリプトや Tailwind JIT に配慮）
- 将来 nonce ベースに差し替える場合でも、ヘッダ生成を関数化しておけば差し替えしやすい

---

## 方針とその理由

1. **ヘッダ生成ロジックを `src/libraries/security-headers.ts` に切り出す**
   - 理由: テスト容易性 / 再利用性 / 将来の差し替え容易性（nonce 化など）。

2. **緩め CSP を採用**
   - 理由: テンプレートとして追加直後に Next / Storybook / shadcn ui などが壊れないことを優先。

3. **HSTS は本番のみ付与**
   - `NODE_ENV === "production"` のときだけ `Strict-Transport-Security` を付ける
   - 理由: localhost の HTTP 開発で HSTS が刺さるとブラウザ側キャッシュで不便。

4. **`remotePatterns` を env で拡張可能に**
   - `EXTRA_REMOTE_IMAGE_HOSTS`（カンマ区切り）を読み、hostname を追加
   - 理由: GCS / R2 / CDN に向けて派生サイト側で `next.config.ts` を触らず切替可能にする。

---

## 具体的なタスク

### 実装

- [ ] `src/libraries/security-headers.ts` を新規作成
  - [ ] `export type SecurityHeader = { key: string; value: string }`
  - [ ] `export function buildCsp(): string` — 緩め CSP を返す
    - `default-src 'self'`
    - `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
    - `style-src 'self' 'unsafe-inline'`
    - `img-src 'self' data: blob: https:`
    - `font-src 'self' data:`
    - `connect-src 'self' https:`
    - `frame-ancestors 'none'`
    - `base-uri 'self'`
    - `form-action 'self'`
  - [ ] `export function buildSecurityHeaders(env: { isProduction: boolean }): SecurityHeader[]`
    - [ ] `Content-Security-Policy` ← `buildCsp()`
    - [ ] `X-Content-Type-Options: nosniff`
    - [ ] `X-Frame-Options: DENY`
    - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
    - [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
    - [ ] 本番のみ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] `next.config.ts` を更新
  - [ ] `buildSecurityHeaders` を import
  - [ ] `async headers()` を実装
    ```ts
    async headers() {
      return [{
        source: "/(.*)",
        headers: buildSecurityHeaders({ isProduction: process.env.NODE_ENV === "production" }),
      }];
    }
    ```
  - [ ] `images.remotePatterns` の構築を関数化し、末尾で `process.env.EXTRA_REMOTE_IMAGE_HOSTS?.split(",")` から `{ protocol: "https", hostname, pathname: "/**" }` を追加（空や未設定なら無視）

### ドキュメント・設定

- [ ] `.env.example` に追記
  - [ ] `# Additional remote image hosts (CSV of hostnames)`
  - [ ] `EXTRA_REMOTE_IMAGE_HOSTS=`（例コメント: `cdn.example.com,images.example.com`）
- [ ] `README.md` に「セキュリティヘッダのカスタマイズ」セクションを追記
  - `src/libraries/security-headers.ts` を編集することで調整可能
  - CSP を nonce ベースへ強化する手順（概要）は future work として記載

### テスト

- [ ] `__tests__/libraries/security-headers.test.ts` を新規作成
  - [ ] `buildSecurityHeaders({ isProduction: true })` に HSTS が含まれる
  - [ ] `buildSecurityHeaders({ isProduction: false })` に HSTS が含まれない
  - [ ] 必須ヘッダ（CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy）が揃う
  - [ ] `buildCsp()` に `frame-ancestors 'none'` / `default-src 'self'` が含まれる
- [ ] `e2e/security-headers.spec.ts` を新規作成
  - [ ] `/` GET でレスポンスヘッダに `x-frame-options: DENY` が付く
  - [ ] `content-security-policy` が付き `frame-ancestors 'none'` を含む
  - [ ] 開発モードでは HSTS が付かない（`strict-transport-security` が undefined）

### 検証

- [ ] `npm run test` 全 pass
- [ ] `npm run build && npm run start` 後に `curl -I http://localhost:3000/` でヘッダ確認
- [ ] `npm run test:e2e` pass（新規 spec 含む）
- [ ] Storybook 起動（`npm run storybook`）でコンソールに CSP 違反が出ない
- [ ] 管理画面のアバター画像表示などで `img-src` 起因の違反が出ない

---

## ロールアウト注意事項

- [ ] 派生サイトで外部 CDN からのスクリプト/画像を使う場合、`buildCsp()` の該当ディレクティブ更新が必要な旨を README に明記
- [ ] Storybook 用の Storybook 設定（`.storybook/`）には本ヘッダは影響しない（Next.js のレスポンスヘッダ機能は Storybook dev server では無関係）

---

## 完了条件

- [ ] 上記全タスクにチェックが入っている
- [ ] `npm run type-check`、`npm run test`、`npm run test:e2e`、`npm run build` がすべて pass
- [ ] `curl -I` で期待ヘッダが返ることを目視確認
