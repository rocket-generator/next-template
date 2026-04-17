# リファクタリング計画 003: Storage / Email プロバイダ切替機構の完成

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の重大 §3
初版: 2026-04-16
改訂: 2026-04-17（Codex 再レビュー反映）
再改訂: 2026-04-17（Codex 第 2 回レビュー反映）
再々改訂: 2026-04-17（Codex 第 3 回レビュー反映 / 事実誤認の訂正）

## 改訂ノート（第 3 回: 2026-04-17）

第 2 回改訂で `.env.example` の現状を誤って記述していたため訂正。実ファイル（git HEAD 時点）を `git show HEAD:.env.example` で確認した結果、以下が事実:

- `SYSTEM_AWS_SES_REGION` / `SYSTEM_AWS_ACCESS_KEY_ID` / `SYSTEM_AWS_SECRET_ACCESS_KEY` / `SYSTEM_AWS_S3_BUCKET` は **既に存在している**
- `AWS_*`（非 SYSTEM プレフィックス）エントリは **既に存在しない**（削除するものが無い）
- 実コード（`storage.ts:512`, `storage.ts:518`）が参照しているのに `.env.example` に未記載なのは `SYSTEM_AWS_S3_REGION` と `LOCALSTACK_PUBLIC_ENDPOINT` のみ
- `SES_FROM_EMAIL` は現役

これを踏まえ `.env.example` タスクを「5 キー全てを新規追加」から「欠落している 2 キー（`SYSTEM_AWS_S3_REGION` / `LOCALSTACK_PUBLIC_ENDPOINT`）を追加 + プロバイダ切替系ブロック新規追加 + `SES_FROM_EMAIL` は deprecated 扱いで残す」に書き直した。

## 改訂ノート（第 2 回: 2026-04-17）

Codex 第 2 回レビューで [P2] `.env.example` の `SYSTEM_AWS_*` 扱いが曖昧（rename なのか追加なのか、既存 `AWS_*` をどうするのかが読み取れない）との指摘。該当タスクを具体化したが、**現状認識に誤りがあったため第 3 回改訂で再訂正**（上記参照）。

## 改訂ノート（第 1 回: 2026-04-17）

Codex による初回再レビューで以下 4 点が指摘され、計画を修正した。

- **[P1] env リネームの更新対象が不足していた**: `docker-compose.yml:65-72` と `README.md:196-202` が `AWS_*` / `AWS_S3_*` のまま。`storage.ts` は既に `SYSTEM_AWS_*` を参照しており、**現時点で Docker 環境はそのままでは storage を正しく初期化できない可能性が高い**。対象ファイルに明示追加。
- **[P1] s3-compatible 設計が不十分だった**: 既存 `S3ProviderConfig` は `endpoint` / `publicEndpoint` / `forcePathStyle` を既に持っているが、新設予定の `S3CompatibleProviderConfig` から `publicEndpoint` を落としていた。さらに `storage.ts:382` に `clientConfig.forcePathStyle = this.config.forcePathStyle || true;` という**常に true になるバグ**があり、`forcePathStyle=false` を設定できない。計画で別 Config を新設するのではなく、**既存 `S3ProviderConfig` を拡張し env ロード関数だけ分岐**する方針に変更 + バグ修正と URL 生成検証を加える。
- **[P2] SES_FROM_EMAIL は provider 依存名**: SMTP を追加するのに AWS 命名を引きずるのは不自然。`EMAIL_FROM` に rename（`SES_FROM_EMAIL` を後方互換フォールバックとして残す）。
- **[P2] 検証が library 単体テストに寄りすぎ**: 実利用箇所は `UserRepository`（`createStorageServiceInstance`）と Better Auth のメールコールバック（`createEmailServiceInstance`）。consumer 側の smoke test / 手動確認を必須タスクに昇格。

---

## 背景

### Storage
- `src/libraries/storage.ts:533-556` — `createStorageServiceInstance()` は S3Provider 決め打ち。`StorageProvider` interface はあるが env での切替機構がない
- `docs/guides/storage-provider.md` に GCS 実装例が記載されているが**未実装**

### Email
- `src/libraries/email.ts:260-270` — `createEmailServiceInstance()` は SESProvider 決め打ち。`EMAIL_PROVIDER` env への参照なし

### env 名の不整合
- `storage.ts` は `SYSTEM_AWS_*` プレフィックス（例: `SYSTEM_AWS_S3_REGION`）
- `email.ts` は `AWS_*` プレフィックス（例: `AWS_SES_REGION`, `AWS_ACCESS_KEY_ID`）
- `docker-compose.yml:65-72` は `AWS_S3_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` / `AWS_SES_REGION` を env として定義 → **storage.ts が `SYSTEM_AWS_*` を読むため実質的に読み込めていない**
- `README.md:196-202` も `AWS_*` 表記
- ドキュメント (`docs/guides/storage-provider.md` など) も `AWS_*` 表記
- Amplify は `AWS_*` プレフィックスを予約語として拒否するため、**正は `SYSTEM_AWS_*`**。`email.ts` / `docker-compose.yml` / `README.md` / ドキュメントを全て `SYSTEM_AWS_*` に揃える必要がある

### `S3Provider` の既存バグ
- `storage.ts:382` — `clientConfig.forcePathStyle = this.config.forcePathStyle || true;`
- `false || true` も `undefined || true` も `true` になるため、**endpoint 指定時に `forcePathStyle: false` を設定することが不可能**
- R2 の virtual-hosted-style endpoint（`<bucket>.r2.cloudflarestorage.com`）等で不便
- s3-compatible 対応を謳うなら修正必須

### 結果として
- Cloudflare (R2) / GCP (GCS) / オンプレ (MinIO) / Resend 等に移したいときに**コード修正が必須**
- Amplify 以外へのデプロイという本リファクタリング全体の目的と矛盾

---

## 方針とその理由

### Storage
`STORAGE_PROVIDER=s3|s3-compatible|gcs` で切替（既定 `s3`）

- **s3**: 現状の AWS S3 + LocalStack（既定動作を壊さない）
- **s3-compatible**: **既存 `S3Provider` / `S3ProviderConfig` をそのまま再利用**し、env ロード関数だけ分岐する（`S3CompatibleProviderConfig` は新設しない）。`endpoint` / `publicEndpoint` / `forcePathStyle` は既に `S3ProviderConfig` に定義済のためそれをそのまま使う。R2 / MinIO / DO Spaces / Wasabi / Backblaze B2 対応。
- **gcs**: docs 記載の GCSProvider を実装（`@google-cloud/storage` を dynamic import）

### `S3Provider` バグ修正（同梱）
- `storage.ts:382` の `this.config.forcePathStyle || true` を以下に差し替え
  ```ts
  if (this.config.forcePathStyle !== undefined) {
    clientConfig.forcePathStyle = this.config.forcePathStyle;
  }
  ```
- これで `forcePathStyle: false` が明示可能に
- `generateFileUrl` の virtual-hosted / path-style 分岐が実際に両方動くことをテストで担保

### Email
`EMAIL_PROVIDER=ses|smtp` で切替（既定 `ses`）

- **ses**: 現状の AWS SES
- **smtp**: nodemailer ベースの `SMTPProvider` を新規追加 → Gmail / Mailgun / 自社 SMTP / Mailhog 対応

### env 整合
- `SYSTEM_AWS_*` に統一（Amplify 互換を優先）
- `email.ts` の `AWS_SES_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` を `SYSTEM_AWS_SES_REGION` / `SYSTEM_AWS_ACCESS_KEY_ID` / `SYSTEM_AWS_SECRET_ACCESS_KEY` に変更
- **`docker-compose.yml` の env ブロック**も `SYSTEM_AWS_*` に揃える（そうしないと Docker 開発環境で storage が起動できない）
- **`README.md:196-202` の env 一覧**も同期
- ドキュメント側の `AWS_*` 表記も `SYSTEM_AWS_*` に揃える

### 送信元アドレス env の provider 非依存化
- `SES_FROM_EMAIL` → `EMAIL_FROM` に rename
- 互換性のため `SES_FROM_EMAIL` も後方互換フォールバックとして読む（警告ログ）
- 理由: SMTP 追加後も AWS 命名を引きずるのは設定 API として不自然

### 不正値は throw
- 起動時に不正な `STORAGE_PROVIDER` / `EMAIL_PROVIDER` が指定されていたら例外（サイレント fallback させない）

---

## 具体的なタスク

### Storage 実装

- [x] `src/libraries/storage.ts` の既存 `S3Provider` バグ修正（先に済ませる）
  - [x] `createS3Client()` の endpoint 分岐（現 `storage.ts:380-383`）を書き換え
    - `clientConfig.forcePathStyle = this.config.forcePathStyle || true;` を削除
    - `if (this.config.forcePathStyle !== undefined) { clientConfig.forcePathStyle = this.config.forcePathStyle; }` に置換
  - [x] `generateFileUrl()` で virtual-hosted-style / path-style の両分岐をテストで検証可能にする
- [x] `src/libraries/storage.ts` に追加
  - [x] `createS3CompatibleProviderConfig(): S3ProviderConfig` を export（**既存 `S3ProviderConfig` をそのまま返す**。新 interface は作らない）
    - env:
      - `S3_COMPATIBLE_ENDPOINT`（必須。未設定なら起動時 throw）
      - `S3_COMPATIBLE_PUBLIC_ENDPOINT`（省略時 `S3_COMPATIBLE_ENDPOINT` と同値）
      - `S3_COMPATIBLE_FORCE_PATH_STYLE`（`"true"` → true / `"false"` → false / 省略 → true）
      - `SYSTEM_AWS_S3_REGION` / `SYSTEM_AWS_ACCESS_KEY_ID` / `SYSTEM_AWS_SECRET_ACCESS_KEY` / `SYSTEM_AWS_S3_BUCKET`
  - [x] `GCSProviderConfig` interface を export
    - `projectId: string` / `bucket: string` / `credentials: { clientEmail: string; privateKey: string }` / `region?: string`
  - [x] `GCSProvider implements StorageProvider` クラスを export
    - [x] コンストラクタで必須設定（projectId / bucket / credentials.*）の存在チェック
    - [x] `@google-cloud/storage` は `await import()` で dynamic load
    - [x] `upload` / `download` / `getSignedUrl` / `delete` / `list` を実装（`docs/guides/storage-provider.md` 準拠）
    - [x] エラーは `UploadResult` / `DownloadResult` / `ListResult` の error に詰めて返す
  - [x] `createGCSProviderConfig()` を export
    - env: `GCS_PROJECT_ID` / `GCS_BUCKET` / `GCS_CLIENT_EMAIL` / `GCS_PRIVATE_KEY`（`\n` を改行に復元） / `GCS_REGION`
  - [x] `createStorageServiceInstance()` を書き換え
    - [x] `const providerName = process.env.STORAGE_PROVIDER ?? "s3"`
    - [x] `switch (providerName)` で振り分け
      - `"s3"` → `new S3Provider(createS3ProviderConfig())`
      - `"s3-compatible"` → `new S3Provider(createS3CompatibleProviderConfig())`
      - `"gcs"` → `new GCSProvider(createGCSProviderConfig())`
      - default → `throw new Error(\`Unknown STORAGE_PROVIDER: ${providerName}\`)`
    - [x] 過剰な `console.log` を削除し、必要最小限の info ログのみ残す
- [x] `package.json` の `dependencies` に `@google-cloud/storage` を追加
  - 理由: dynamic import のため、未使用時も bundle から外れる。`optionalDependencies` だと Next.js のビルド解決で問題が出やすいので通常 dep。

### Email 実装

- [x] `src/libraries/email.ts` に追加
  - [x] `SMTPProviderConfig` interface export
    - `host: string` / `port: number` / `secure: boolean` / `user?: string` / `pass?: string`
  - [x] `SMTPProvider implements EmailProvider` クラス export
    - [x] `nodemailer` は `await import()` で dynamic load
    - [x] `sendEmail(options)` で `nodemailer.createTransport({ host, port, secure, auth: { user, pass } }).sendMail({ from, to, subject, html, text })`
    - [x] `messageId` を拾って `EmailResult` に詰める
    - [x] try/catch で失敗時は `success: false, error` を返す
  - [x] `createSMTPProviderConfig()` を export
    - env: `SMTP_HOST` / `SMTP_PORT`（数値化、既定 587） / `SMTP_SECURE`（`"true"` のみ true、既定 false） / `SMTP_USER` / `SMTP_PASS`
  - [x] `createSESProviderConfig()` の env 名を差し替え
    - `AWS_SES_REGION` → `SYSTEM_AWS_SES_REGION`
    - `AWS_ACCESS_KEY_ID` → `SYSTEM_AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY` → `SYSTEM_AWS_SECRET_ACCESS_KEY`
    - `LOCALSTACK_ENDPOINT` は据え置き
  - [x] `createEmailServiceInstance()` を書き換え
    - [x] `const providerName = process.env.EMAIL_PROVIDER ?? "ses"`
    - [x] `switch (providerName)` で振り分け
      - `"ses"` → `new SESProvider(createSESProviderConfig())`
      - `"smtp"` → `new SMTPProvider(createSMTPProviderConfig())`
      - default → `throw new Error(\`Unknown EMAIL_PROVIDER: ${providerName}\`)`
    - [x] `fromEmail` の解決を provider 非依存に
      - [x] `process.env.EMAIL_FROM` を優先
      - [x] なければ `process.env.SES_FROM_EMAIL`（後方互換、`console.warn` でリネーム推奨を出す）
      - [x] それもなければ環境依存のデフォルト（`NODE_ENV=production` で `noreply@example.com`、それ以外は `noreply@localhost`）
- [x] `package.json` の `dependencies` に `nodemailer` を追加
- [x] `package.json` の `devDependencies` に `@types/nodemailer` を追加

### env / ドキュメント

- [x] `.env.example` を以下の方針で書き換え
  - [x] **前提認識（事実ベース）**: 現行 `.env.example`（git HEAD 時点）には以下が存在する
    - `SYSTEM_AWS_SES_REGION` / `SYSTEM_AWS_ACCESS_KEY_ID` / `SYSTEM_AWS_SECRET_ACCESS_KEY` / `SYSTEM_AWS_S3_BUCKET`（既に `SYSTEM_` プレフィックス化済）
    - `SES_FROM_EMAIL`（現役、email.ts が参照）
    - `LOCALSTACK_ENDPOINT` / `USE_LOCALSTACK=true`
    - DB TLS 系（`DATABASE_SSL_*`、Plan 001 で追加済）
    - `EXTRA_REMOTE_IMAGE_URLS`（Plan 002 で追加済）
    - `AWS_*`（非 SYSTEM プレフィックス）エントリは**既に存在しない**
  - [x] **runtime と乖離している箇所**（本タスクで解消）
    - [x] `SYSTEM_AWS_S3_REGION` が `.env.example` に未記載（`storage.ts:512` が参照）
    - [x] `LOCALSTACK_PUBLIC_ENDPOINT` が未記載（`storage.ts:518` が参照。LocalStack 利用時の公開 URL 生成で使用）
  - [x] **欠落キーの新規追加**
    - [x] `SYSTEM_AWS_S3_REGION=us-east-1`（AWS SES Configuration ブロック内、他 `SYSTEM_AWS_*` と同じ場所）
    - [x] `LOCALSTACK_PUBLIC_ENDPOINT=http://localhost:4566`（LocalStack Configuration ブロック内）
  - [x] **既存 `SYSTEM_AWS_*` エントリは保持**（削除や rename はしない）
  - [x] **`SES_FROM_EMAIL` は deprecated 扱いで残す**
    - [x] `EMAIL_FROM=noreply@yourdomain.com` を新規追加（`SES_FROM_EMAIL` の直前に置く）
    - [x] `SES_FROM_EMAIL` の行に `# deprecated: use EMAIL_FROM (kept for backward compatibility)` コメントを付与
  - [x] Storage プロバイダ切替ブロックを新規追加
    - [x] `# Storage provider (s3 | s3-compatible | gcs)`
    - [x] `STORAGE_PROVIDER=s3`
  - [x] S3 互換ブロックを新規追加
    - [x] `S3_COMPATIBLE_ENDPOINT=`
    - [x] `S3_COMPATIBLE_PUBLIC_ENDPOINT=`
    - [x] `S3_COMPATIBLE_FORCE_PATH_STYLE=true`
  - [x] GCS ブロックを新規追加
    - [x] `GCS_PROJECT_ID=`
    - [x] `GCS_BUCKET=`
    - [x] `GCS_CLIENT_EMAIL=`
    - [x] `GCS_PRIVATE_KEY=`
    - [x] `GCS_REGION=`
  - [x] Email プロバイダ切替ブロックを新規追加
    - [x] `# Email provider (ses | smtp)`
    - [x] `EMAIL_PROVIDER=ses`
  - [x] SMTP ブロックを新規追加
    - [x] `SMTP_HOST=`
    - [x] `SMTP_PORT=587`
    - [x] `SMTP_SECURE=false`
    - [x] `SMTP_USER=`
    - [x] `SMTP_PASS=`
  - [ ] **完了条件**: `.env.example` をコピーして `.env` とし、`docker-compose.yml` の env ブロック（別タスクで `SYSTEM_AWS_*` に移行）と合わせて `npm run dev` が起動、LocalStack への S3 PUT/GET が成功すること
- [x] **`docker-compose.yml` の env を `SYSTEM_AWS_*` に更新**（line 65-72）
  - [x] `AWS_S3_REGION` → `SYSTEM_AWS_S3_REGION`
  - [x] `AWS_ACCESS_KEY_ID` → `SYSTEM_AWS_ACCESS_KEY_ID`
  - [x] `AWS_SECRET_ACCESS_KEY` → `SYSTEM_AWS_SECRET_ACCESS_KEY`
  - [x] `AWS_S3_BUCKET` → `SYSTEM_AWS_S3_BUCKET`
  - [x] `AWS_SES_REGION` → `SYSTEM_AWS_SES_REGION`
  - [x] `SES_FROM_EMAIL` → `EMAIL_FROM`（旧名を併記しておくかは実装時判断。互換フォールバック有）
  - [x] コメント「# LocalStack S3 Configuration」を「# LocalStack S3 / SES Configuration (SYSTEM_ prefix required for Amplify compatibility)」に更新
- [x] **`README.md:196-202` の env 一覧を更新**
  - [x] `AWS_S3_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` / `AWS_SES_REGION` を `SYSTEM_AWS_*` に
  - [x] `SES_FROM_EMAIL` → `EMAIL_FROM` に（互換フォールバックの旨コメント）
  - [x] `STORAGE_PROVIDER` / `EMAIL_PROVIDER` / `S3_COMPATIBLE_*` / `SMTP_*` / `GCS_*` の説明を追記
- [x] `docs/guides/storage-provider.md` を更新
  - [x] 「実装済」前提に書き換え
  - [x] 切替方法（`STORAGE_PROVIDER` env）
  - [x] S3 / S3 互換 / GCS 各プロバイダの env 一覧
  - [x] 新プロバイダ追加手順（残置）
  - [x] env 名の `AWS_*` → `SYSTEM_AWS_*` への書き換え
  - [x] `forcePathStyle` バグ修正の注意書き（リネームではなく挙動変更）
- [x] `docs/guides/email-provider.md` を更新
  - [x] SES / SMTP 各プロバイダの env 一覧
  - [x] 切替方法（`EMAIL_PROVIDER` env）
  - [x] `EMAIL_FROM` / `SES_FROM_EMAIL`（deprecated）の説明
  - [x] 新プロバイダ追加手順（Resend 等を future work として記載）
- [x] `.cursor/rules/storage-provider.mdc` / `.cursor/rules/add-email-provider.mdc` が docs と食い違う場合は同期

### テスト

- [x] `__tests__/libraries/storage.test.ts` を拡充
  - [x] `STORAGE_PROVIDER` 未設定で S3Provider が使われる（`SYSTEM_AWS_*` env 経由で config が組まれる）
  - [x] `s3-compatible` で endpoint / publicEndpoint / forcePathStyle が S3Provider に正しく渡る
    - [x] `S3_COMPATIBLE_FORCE_PATH_STYLE=false` で `false` が実際に S3Client config に載ること（既存バグの回帰防止）
    - [x] `S3_COMPATIBLE_PUBLIC_ENDPOINT` 未設定時、`endpoint` と同値になること
    - [x] `S3_COMPATIBLE_ENDPOINT` 未設定で throw
  - [x] `generateFileUrl()` が `forcePathStyle: true` と `false` で URL 形が正しく切り替わる
  - [x] `gcs` で GCSProvider が返る（`@google-cloud/storage` は `jest.mock`）
  - [x] 不正値 (`s4` など) で throw
- [x] `__tests__/libraries/email.test.ts` を拡充
  - [x] `EMAIL_PROVIDER` 未設定で SESProvider
  - [x] `EMAIL_PROVIDER=smtp` で SMTPProvider（`nodemailer` は `jest.mock`）
  - [x] 不正値で throw
  - [x] `SYSTEM_AWS_*` 環境変数で SESProvider 設定が生成される
  - [x] `EMAIL_FROM` が設定されているとそれが使われる
  - [x] `EMAIL_FROM` 未設定で `SES_FROM_EMAIL` のみ設定されているときは fallback し、`console.warn` が呼ばれる
  - [x] 両方未設定で環境依存デフォルトになる
- [x] **consumer 側の smoke test を追加**
  - [x] `__tests__/repositories/user_repository.test.ts`（or 新規）で `new UserRepository()` が `STORAGE_PROVIDER=s3-compatible` でも例外を投げずに構築できる（`@aws-sdk/client-s3` は `jest.mock`）
  - [x] `__tests__/libraries/auth.test.ts` で `EMAIL_PROVIDER=smtp` 切替時も Better Auth の sendResetPassword / sendVerificationEmail コールバックが例外を出さずに SMTPProvider.sendEmail を呼ぶ
- [x] `npm run test` 全 pass

### 検証

- [x] `npm run type-check` pass
- [x] `npm run test` 全 pass
- [x] `npm run build` pass
- [ ] **Docker Compose + LocalStack 環境で実ログイン → アバター画像 PUT / GET が成功**（storage consumer 側の疎通確認。`docker-compose.yml` の env リネーム後）
- [ ] **ローカル `npm run dev` で sendPasswordReset の実行経路を走らせ、メール送信コールバックが期待 provider を呼ぶ**（email consumer 側の疎通確認）
- [ ] （任意）MinIO (`docker run -p 9000:9000 minio/minio server /data`) で `STORAGE_PROVIDER=s3-compatible` + `S3_COMPATIBLE_ENDPOINT=http://localhost:9000` で PUT/GET 確認
  - [ ] `S3_COMPATIBLE_FORCE_PATH_STYLE=true` / `false` 両方で動作確認
- [ ] （任意）Mailhog (`docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog`) で `EMAIL_PROVIDER=smtp` + `SMTP_HOST=localhost` + `SMTP_PORT=1025` で `sendPasswordResetEmail` 送信 → 受信箱で目視確認
- [ ] （任意）R2 で `STORAGE_PROVIDER=s3-compatible` の疎通確認

---

## ロールアウト注意事項

- [x] 既存プロジェクトで `AWS_SES_REGION` 等を使っていた場合、`SYSTEM_AWS_SES_REGION` へのリネームが必要。README の移行手順に記載
- [x] `docker-compose.yml` の env ブロック更新後、ローカル開発者は既存 `.env` を見直す必要あり。移行手順を README に記載
- [x] `SES_FROM_EMAIL` は `EMAIL_FROM` に推奨移行。旧名は後方互換として残すが `console.warn` が出るため、派生プロジェクト側で順次更新
- [x] `STORAGE_PROVIDER` / `EMAIL_PROVIDER` 未設定時は既定 `s3` / `ses` なので既存動作を壊さない
- [x] `forcePathStyle` バグ修正により、`endpoint` 指定 + 明示的に `forcePathStyle: false` を渡していた既存プロジェクトが（もしあれば）動作変化する可能性。ただし現状はバグで常に true だったので実質的な影響はほぼ無し
- [x] `@google-cloud/storage` / `nodemailer` の追加で `node_modules` サイズが増える点を許容する

---

## 完了条件

- [ ] 上記全タスクにチェックが入っている
- [x] `npm run type-check`、`npm run test`、`npm run build` がすべて pass
- [ ] 既存 E2E が引き続き pass（LocalStack 環境、`docker-compose.yml` 更新版で）
- [ ] consumer 側（UserRepository / auth.ts）の疎通確認がローカル `npm run dev` で取れている
- [x] `docs/guides/storage-provider.md` / `docs/guides/email-provider.md` が実コードと一致
- [x] `.env.example` / `docker-compose.yml` / `README.md` が実装と一致（3 ファイル揃って `SYSTEM_AWS_*` / `EMAIL_FROM`）
