# リファクタリング計画 003: Storage / Email プロバイダ切替機構の完成

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の重大 §3
作成日: 2026-04-16

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
- ドキュメント (`docs/guides/storage-provider.md` など) は `AWS_*` 表記
- Amplify は `AWS_*` プレフィックスを予約語として拒否するため、**正は `SYSTEM_AWS_*`**。`email.ts` とドキュメントを `SYSTEM_AWS_*` に揃える必要がある

### 結果として
- Cloudflare (R2) / GCP (GCS) / オンプレ (MinIO) / Resend 等に移したいときに**コード修正が必須**
- Amplify 以外へのデプロイという本リファクタリング全体の目的と矛盾

---

## 方針とその理由

### Storage
`STORAGE_PROVIDER=s3|s3-compatible|gcs` で切替（既定 `s3`）

- **s3**: 現状の AWS S3 + LocalStack（既定動作を壊さない）
- **s3-compatible**: 既存 `S3Provider` を再利用し `endpoint` / `forcePathStyle` を env で受ける → R2 / MinIO / DO Spaces / Wasabi 対応
- **gcs**: docs 記載の GCSProvider を実装（`@google-cloud/storage` を dynamic import）

### Email
`EMAIL_PROVIDER=ses|smtp` で切替（既定 `ses`）

- **ses**: 現状の AWS SES
- **smtp**: nodemailer ベースの `SMTPProvider` を新規追加 → Gmail / Mailgun / 自社 SMTP / Mailhog 対応

### env 整合
- `SYSTEM_AWS_*` に統一（Amplify 互換を優先）
- `email.ts` の `AWS_SES_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` を `SYSTEM_AWS_SES_REGION` / `SYSTEM_AWS_ACCESS_KEY_ID` / `SYSTEM_AWS_SECRET_ACCESS_KEY` に変更
- ドキュメント側の `AWS_*` 表記も `SYSTEM_AWS_*` に揃える

### 不正値は throw
- 起動時に不正な `STORAGE_PROVIDER` / `EMAIL_PROVIDER` が指定されていたら例外（サイレント fallback させない）

---

## 具体的なタスク

### Storage 実装

- [ ] `src/libraries/storage.ts` に追加
  - [ ] `S3CompatibleProviderConfig` を interface export（`S3ProviderConfig` と同形で `endpoint`・`forcePathStyle` を必須化）
  - [ ] `createS3CompatibleProviderConfig()` を export
    - env: `S3_COMPATIBLE_ENDPOINT` / `S3_COMPATIBLE_FORCE_PATH_STYLE`（`"true"` のみ true、既定 true） / `SYSTEM_AWS_S3_REGION` / `SYSTEM_AWS_ACCESS_KEY_ID` / `SYSTEM_AWS_SECRET_ACCESS_KEY` / `SYSTEM_AWS_S3_BUCKET`
  - [ ] `GCSProviderConfig` interface を export
    - `projectId: string` / `bucket: string` / `credentials: { clientEmail: string; privateKey: string }` / `region?: string`
  - [ ] `GCSProvider implements StorageProvider` クラスを export
    - [ ] コンストラクタで必須設定（projectId / bucket / credentials.*）の存在チェック
    - [ ] `@google-cloud/storage` は `await import()` で dynamic load
    - [ ] `upload` / `download` / `getSignedUrl` / `delete` / `list` を実装（`docs/guides/storage-provider.md` 準拠）
    - [ ] エラーは `UploadResult` / `DownloadResult` / `ListResult` の error に詰めて返す
  - [ ] `createGCSProviderConfig()` を export
    - env: `GCS_PROJECT_ID` / `GCS_BUCKET` / `GCS_CLIENT_EMAIL` / `GCS_PRIVATE_KEY`（`\n` を改行に復元） / `GCS_REGION`
  - [ ] `createStorageServiceInstance()` を書き換え
    - [ ] `const providerName = process.env.STORAGE_PROVIDER ?? "s3"`
    - [ ] `switch (providerName)` で振り分け
      - `"s3"` → `new S3Provider(createS3ProviderConfig())`
      - `"s3-compatible"` → `new S3Provider(createS3CompatibleProviderConfig())`
      - `"gcs"` → `new GCSProvider(createGCSProviderConfig())`
      - default → `throw new Error(\`Unknown STORAGE_PROVIDER: ${providerName}\`)`
    - [ ] 過剰な `console.log` を削除し、必要最小限の info ログのみ残す
- [ ] `package.json` の `dependencies` に `@google-cloud/storage` を追加
  - 理由: dynamic import のため、未使用時も bundle から外れる。`optionalDependencies` だと Next.js のビルド解決で問題が出やすいので通常 dep。

### Email 実装

- [ ] `src/libraries/email.ts` に追加
  - [ ] `SMTPProviderConfig` interface export
    - `host: string` / `port: number` / `secure: boolean` / `user?: string` / `pass?: string`
  - [ ] `SMTPProvider implements EmailProvider` クラス export
    - [ ] `nodemailer` は `await import()` で dynamic load
    - [ ] `sendEmail(options)` で `nodemailer.createTransport({ host, port, secure, auth: { user, pass } }).sendMail({ from, to, subject, html, text })`
    - [ ] `messageId` を拾って `EmailResult` に詰める
    - [ ] try/catch で失敗時は `success: false, error` を返す
  - [ ] `createSMTPProviderConfig()` を export
    - env: `SMTP_HOST` / `SMTP_PORT`（数値化、既定 587） / `SMTP_SECURE`（`"true"` のみ true、既定 false） / `SMTP_USER` / `SMTP_PASS`
  - [ ] `createSESProviderConfig()` の env 名を差し替え
    - `AWS_SES_REGION` → `SYSTEM_AWS_SES_REGION`
    - `AWS_ACCESS_KEY_ID` → `SYSTEM_AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY` → `SYSTEM_AWS_SECRET_ACCESS_KEY`
    - `LOCALSTACK_ENDPOINT` は据え置き
  - [ ] `createEmailServiceInstance()` を書き換え
    - [ ] `const providerName = process.env.EMAIL_PROVIDER ?? "ses"`
    - [ ] `switch (providerName)` で振り分け
      - `"ses"` → `new SESProvider(createSESProviderConfig())`
      - `"smtp"` → `new SMTPProvider(createSMTPProviderConfig())`
      - default → `throw new Error(\`Unknown EMAIL_PROVIDER: ${providerName}\`)`
    - [ ] `fromEmail` の決定ロジックは維持（`SES_FROM_EMAIL` 優先、なければ環境依存のデフォルト）
- [ ] `package.json` の `dependencies` に `nodemailer` を追加
- [ ] `package.json` の `devDependencies` に `@types/nodemailer` を追加

### env / ドキュメント

- [ ] `.env.example` に以下ブロックを追記（順に整理）
  - [ ] Storage プロバイダ
    - `# Storage provider (s3 | s3-compatible | gcs)`
    - `STORAGE_PROVIDER=s3`
  - [ ] S3 互換
    - `S3_COMPATIBLE_ENDPOINT=`
    - `S3_COMPATIBLE_FORCE_PATH_STYLE=true`
  - [ ] GCS
    - `GCS_PROJECT_ID=`
    - `GCS_BUCKET=`
    - `GCS_CLIENT_EMAIL=`
    - `GCS_PRIVATE_KEY=`
    - `GCS_REGION=`
  - [ ] Email プロバイダ
    - `# Email provider (ses | smtp)`
    - `EMAIL_PROVIDER=ses`
  - [ ] SMTP
    - `SMTP_HOST=`
    - `SMTP_PORT=587`
    - `SMTP_SECURE=false`
    - `SMTP_USER=`
    - `SMTP_PASS=`
- [ ] `.env.example` の既存 AWS 系環境変数を `SYSTEM_AWS_*` に統一（Amplify 制約コメント付与）
- [ ] `docs/guides/storage-provider.md` を更新
  - [ ] 「実装済」前提に書き換え
  - [ ] 切替方法（`STORAGE_PROVIDER` env）
  - [ ] S3 / S3 互換 / GCS 各プロバイダの env 一覧
  - [ ] 新プロバイダ追加手順（残置）
  - [ ] env 名の `AWS_*` → `SYSTEM_AWS_*` への書き換え
- [ ] `docs/guides/email-provider.md` を更新
  - [ ] SES / SMTP 各プロバイダの env 一覧
  - [ ] 切替方法（`EMAIL_PROVIDER` env）
  - [ ] 新プロバイダ追加手順（Resend 等を future work として記載）
- [ ] `.cursor/rules/storage-provider.mdc` / `.cursor/rules/add-email-provider.mdc` が docs と食い違う場合は同期

### テスト

- [ ] `__tests__/libraries/storage.test.ts` を拡充
  - [ ] `STORAGE_PROVIDER` 未設定で S3Provider が使われる
  - [ ] `s3-compatible` で endpoint / forcePathStyle が S3Provider に渡る
  - [ ] `gcs` で GCSProvider が返る（`@google-cloud/storage` は `jest.mock`）
  - [ ] 不正値 (`s4` など) で throw
- [ ] `__tests__/libraries/email.test.ts` を拡充
  - [ ] `EMAIL_PROVIDER` 未設定で SESProvider
  - [ ] `EMAIL_PROVIDER=smtp` で SMTPProvider（`nodemailer` は `jest.mock`）
  - [ ] 不正値で throw
  - [ ] `SYSTEM_AWS_*` 環境変数で SESProvider 設定が生成される
- [ ] `npm run test` 全 pass

### 検証

- [ ] `npm run type-check` pass
- [ ] `npm run test` 全 pass
- [ ] `npm run build` pass
- [ ] Docker Compose + LocalStack で `STORAGE_PROVIDER=s3` / `EMAIL_PROVIDER=ses` で既存 E2E が引き続き pass
- [ ] （任意）MinIO (`docker run -p 9000:9000 minio/minio server /data`) で `STORAGE_PROVIDER=s3-compatible` + `S3_COMPATIBLE_ENDPOINT=http://localhost:9000` で PUT/GET 確認
- [ ] （任意）Mailhog (`docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog`) で `EMAIL_PROVIDER=smtp` + `SMTP_HOST=localhost` + `SMTP_PORT=1025` で `sendPasswordResetEmail` 送信 → 受信箱で目視確認

---

## ロールアウト注意事項

- [ ] 既存プロジェクトで `AWS_SES_REGION` 等を使っていた場合、`SYSTEM_AWS_SES_REGION` へのリネームが必要。README の移行手順に記載
- [ ] `STORAGE_PROVIDER` / `EMAIL_PROVIDER` 未設定時は既定 `s3` / `ses` なので既存動作を壊さない
- [ ] `@google-cloud/storage` / `nodemailer` の追加で `node_modules` サイズが増える点を許容する

---

## 完了条件

- [ ] 上記全タスクにチェックが入っている
- [ ] `npm run type-check`、`npm run test`、`npm run build` がすべて pass
- [ ] 既存 E2E が引き続き pass（LocalStack 環境）
- [ ] `docs/guides/storage-provider.md` / `docs/guides/email-provider.md` が実コードと一致
- [ ] `.env.example` が実装と一致
