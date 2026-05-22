# リファクタリング計画 002: セキュリティヘッダとリモート画像設定の整備

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の重大 §2  
初版: 2026-04-16  
改訂: 2026-04-17

---

## 背景

現状の `next.config.ts` には `headers()` がなく、テンプレートから生成される Next.js アプリは CSP / HSTS / X-Frame-Options / Referrer-Policy / Permissions-Policy を一切返していない。

一方で、このテンプレートの既定開発環境は「外部接続ゼロ」ではない。

- `.env.example` では `NEXT_PUBLIC_CLIENT_COMPONENT_BACKEND_API_BASE_URL=http://localhost:8000/api`
- `.env.example` では `LOCALSTACK_PUBLIC_ENDPOINT=http://localhost:4566`
- `src/libraries/storage.ts` は LocalStack 利用時に `http://localhost:4566` ベースの公開 URL を返す
- `next.config.ts` の `images.remotePatterns` は LocalStack と S3 のみを固定列挙している

したがって今回の計画は、単にヘッダを追加するだけでは不十分である。テンプレート利用直後のローカル開発を壊さずに、最低限のセキュリティヘッダを標準搭載し、画像ホストの拡張も現実的な形に改める必要がある。

また、前版計画にあった以下の前提は不適切だったため撤回する。

- `unsafe-eval` を本番でも常時許可する
- `EXTRA_REMOTE_IMAGE_HOSTS` のような hostname-only 設計で十分とみなす
- Storybook を CSP の確認対象に含める
- Playwright で新規 E2E を追加すればそのまま `npm run test:e2e` が成立するとみなす

---

## 到達目標

- [x] Next.js レスポンスにテンプレート標準のセキュリティヘッダを付与する
- [ ] ローカル開発環境（`localhost:3000`, `localhost:8000`, `localhost:4566`）を CSP で壊さない
- [x] 本番のみ HSTS を付与し、localhost 開発には影響させない
- [x] 追加のリモート画像ソースを `next.config.ts` 直編集なしで設定できるようにする
- [x] 将来 nonce ベース CSP へ移行しやすいよう、ヘッダ生成ロジックを純粋関数として切り出す

---

## 今回やらないこと

- `src/proxy.ts` で nonce を生成する strict CSP への移行
- nonce 導入に伴う dynamic rendering 強制
- Storybook dev server に対するヘッダ注入
- Playwright 実行基盤の全面見直し
- 外部スクリプト利用時の個別 CSP 緩和（必要な派生サイト側で調整する）

---

## 実装方針

1. **ヘッダ生成ロジックは `src/libraries/security-headers.ts` に分離する**
   - `next.config.ts` から直接文字列を組み立てず、純粋関数として切り出して Jest で検証可能にする。

2. **CSP は dev/prod で明示的に挙動を分ける**
   - development:
     - `script-src` で `'unsafe-eval'` を許可
     - `img-src` で `http:` を許可
     - `connect-src` で `http:` / `ws:` / `wss:` を許可
   - production:
     - `'unsafe-eval'` は許可しない
     - 汎用 `http:` / `ws:` は許可しない
   - 理由: Next.js 開発時の HMR とローカル API / LocalStack を壊さず、本番だけを不必要に緩めないため。

3. **CSP は「緩め」だが、無制限にはしない**
   - 維持するディレクティブ:
     - `default-src 'self'`
     - `base-uri 'self'`
     - `form-action 'self'`
     - `frame-ancestors 'none'`
     - `object-src 'none'`
     - `script-src 'self' 'unsafe-inline'`
     - `style-src 'self' 'unsafe-inline'`
     - `img-src 'self' data: blob: https:`（dev のみ `http:` 追加）
     - `font-src 'self' data:`
     - `connect-src 'self' https:`（dev のみ `http:` / `ws:` / `wss:` 追加）
   - `X-Frame-Options: DENY` は `frame-ancestors 'none'` の補完として残す。

4. **HSTS は本番限定、かつ preload は付けない**
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - 理由: preload はテンプレート既定値としては強すぎる。サブドメイン HTTPS 化が完了していない利用者を巻き込まないため。

5. **追加画像ソースは hostname ではなく「URL プレフィックス」で受ける**
   - 新規 env: `EXTRA_REMOTE_IMAGE_URLS`
   - 値は CSV の絶対 URL とする
   - 例:
     - `https://cdn.example.com`
     - `https://images.example.com/account123/`
     - `http://localhost:9000/my-bucket/`
   - これを `protocol` / `hostname` / `port` / `pathname` に分解して `remotePatterns` 化する。
   - 理由: hostname-only では protocol / port / path を表現できず、MinIO・R2・GCS・path-prefix CDN に弱い。

6. **env の不正値は黙殺せず、設定読み込み時に fail fast する**
   - 空文字のエントリだけ無視
   - URL として解釈できない値、`http` / `https` 以外の scheme は例外にする
   - 理由: typo を見逃すと画像だけ本番で壊れるため。

7. **今回の自動テストは Jest までに留める**
   - `playwright.config.ts` では `webServer` が未設定であり、新規 E2E を追加しても実行前提が曖昧なため。
   - エンドツーエンド確認は `curl -I` による dev / prod 手動検証で担保する。

---

## 対象ファイル

### 新規作成

- `src/libraries/security-headers.ts`
- `src/libraries/remote-image-patterns.ts`
- `__tests__/libraries/security-headers.test.ts`
- `__tests__/libraries/remote-image-patterns.test.ts`

### 更新

- `next.config.ts`
- `.env.example`
- `README.md`

---

## 具体的なタスク

### 実装

- [x] `src/libraries/security-headers.ts` を新規作成
  - [x] `export type SecurityHeader = { key: string; value: string }`
  - [x] `export type SecurityHeadersEnv = { isDevelopment: boolean; isProduction: boolean }`
  - [x] `buildCsp(env: SecurityHeadersEnv): string` を実装
    - [x] 余分な改行・スペースを畳み込んだ 1 行文字列を返す
    - [x] production では `'unsafe-eval'` を含めない
    - [x] development では `img-src` に `http:` を含める
    - [x] development では `connect-src` に `http:` / `ws:` / `wss:` を含める
    - [x] `object-src 'none'` を含める
  - [x] `buildSecurityHeaders(env: SecurityHeadersEnv): SecurityHeader[]` を実装
    - [x] `Content-Security-Policy`
    - [x] `X-Content-Type-Options: nosniff`
    - [x] `X-Frame-Options: DENY`
    - [x] `Referrer-Policy: strict-origin-when-cross-origin`
    - [x] `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
    - [x] production のみ `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - [x] Next.js / DOM 依存を持たない純粋関数にする

- [x] `src/libraries/remote-image-patterns.ts` を新規作成
  - [x] 既存の LocalStack / AWS S3 用 `remotePatterns` をこのファイルへ移す
  - [x] `buildRemoteImagePatterns(extraRemoteImageUrls?: string): RemotePattern[]` を実装
  - [x] CSV を split して空要素を除外する
  - [x] 各要素を `new URL(...)` で解釈し、`protocol` / `hostname` / `port` / `pathname` に落とす
  - [x] `pathname` は以下の規則で正規化する
    - [x] `/` または空なら `/**`
    - [x] `/account123/` なら `/account123/**`
    - [x] 末尾スラッシュの有無で結果が変わらないようにする
  - [x] `http:` / `https:` 以外は例外にする
  - [x] 不正 URL も例外にする

- [x] `next.config.ts` を更新
  - [x] `buildSecurityHeaders` を import
  - [x] `buildRemoteImagePatterns` を import
  - [x] `async headers()` を追加し、`/(.*)` へ全ヘッダを適用する
  - [x] `buildSecurityHeaders({ isDevelopment: process.env.NODE_ENV === "development", isProduction: process.env.NODE_ENV === "production" })` を使う
  - [x] `images.remotePatterns` を `buildRemoteImagePatterns(process.env.EXTRA_REMOTE_IMAGE_URLS)` に置き換える
  - [x] 今回は `src/proxy.ts` にヘッダ注入処理を移さない

### ドキュメント・設定

- [x] `.env.example` に追記
  - [x] `# Additional remote image URL prefixes (CSV of absolute URLs)`
  - [x] `EXTRA_REMOTE_IMAGE_URLS=`
  - [x] コメント例を追記
    - [x] `https://cdn.example.com`
    - [x] `https://images.example.com/account123/`
    - [x] `http://localhost:9000/my-bucket/`

- [x] `README.md` に「Security Headers / External Images」節を追加
  - [x] テンプレート標準で付与するヘッダを列挙
  - [x] development と production で CSP / HSTS が異なることを明記
  - [x] `EXTRA_REMOTE_IMAGE_URLS` の使い方を記載
  - [x] 外部 script / image / API を production で使う場合は `src/libraries/security-headers.ts` の更新が必要と明記
  - [x] nonce ベース CSP は別計画で扱う future work と明記

### テスト

- [x] `__tests__/libraries/security-headers.test.ts` を新規作成
  - [x] development の CSP に `'unsafe-eval'` が含まれる
  - [x] production の CSP に `'unsafe-eval'` が含まれない
  - [x] development の CSP に `img-src ... http:` が含まれる
  - [x] development の CSP に `connect-src ... http: ws: wss:` が含まれる
  - [x] production の CSP に汎用 `http:` / `ws:` が含まれない
  - [x] `buildSecurityHeaders({ isProduction: true, isDevelopment: false })` に HSTS が含まれる
  - [x] `buildSecurityHeaders({ isProduction: false, isDevelopment: true })` に HSTS が含まれない
  - [x] `frame-ancestors 'none'`, `object-src 'none'`, `default-src 'self'` が含まれる

- [x] `__tests__/libraries/remote-image-patterns.test.ts` を新規作成
  - [x] 既定パターンに LocalStack と AWS S3 の既存定義が含まれる
  - [x] `https://cdn.example.com` が `protocol=https`, `hostname=cdn.example.com`, `pathname=/**` に変換される
  - [x] `https://images.example.com/account123/` が `pathname=/account123/**` に変換される
  - [x] `http://localhost:9000/my-bucket/` が `port=9000`, `pathname=/my-bucket/**` に変換される
  - [x] 空の CSV 要素は無視される
  - [x] `ftp://example.com` で例外になる
  - [x] `not-a-url` で例外になる

- [x] 今回は `e2e/security-headers.spec.ts` を追加しない
  - [x] 理由を計画に明記する
    - [x] 現行 `playwright.config.ts` に `webServer` がなく、ヘッダ検証の前提サーバが未定義
    - [x] 今回の変更は config / helper レベルであり、Jest + `curl` 検証で十分にリスクを抑えられる

### 検証

- [x] `npm run type-check`
- [x] `npm run test -- __tests__/libraries/security-headers.test.ts __tests__/libraries/remote-image-patterns.test.ts`
- [x] `npm run build`

- [x] development 検証
  - [x] `npm run dev` を起動
  - [x] 空きポートに対して `curl -I` を実行（実測: `http://localhost:3001/`）
  - [x] `Content-Security-Policy` が返る
  - [x] `X-Frame-Options: DENY` が返る
  - [x] `Strict-Transport-Security` が返らない

- [x] production 検証
  - [x] `npm run start` を起動
  - [x] 空きポートに対して `curl -I` を実行（実測: `http://localhost:3002/`）
  - [x] `Content-Security-Policy` が返る
  - [x] `X-Frame-Options: DENY` が返る
  - [x] `Strict-Transport-Security` が返る

- [ ] ローカルで LocalStack を使っている場合のみ追加確認
  - [ ] アバター画像や LocalStack 公開 URL が CSP / `next/image` 設定でブロックされないことを確認

---

## ロールアウト注意事項

- [x] production で外部 CDN / 解析タグ / 外部 API / WebSocket を使う派生サイトは、`src/libraries/security-headers.ts` を個別調整する必要がある
- [x] `EXTRA_REMOTE_IMAGE_URLS` は画像読み込み許可だけであり、CSP の `img-src` まで自動更新するわけではない点を README に明記する
- [x] nonce ベース CSP へ移行する場合は `src/proxy.ts` を使う別計画として切り出す
- [x] HSTS preload は今回入れない。必要ならサブドメイン HTTPS 化完了後に別途 opt-in で検討する
- [x] Storybook は Next.js の `headers()` 対象外なので、この計画の検証対象から外す

---

## 完了条件

- [ ] 上記タスクがすべて完了している
- [x] `npm run type-check`、対象 Jest テスト、`npm run build` が pass している
- [x] development の `curl -I` で CSP が返り、HSTS が返らないことを確認している
- [x] production の `curl -I` で CSP と HSTS が返ることを確認している
- [x] `README.md` と `.env.example` が実装と一致している
