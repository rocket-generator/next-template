# ストレージプロバイダー追加ガイド

このテンプレートのストレージ層は `src/libraries/storage.ts` に集約されています。  
プロバイダーを追加・切替する際は、保存実装、ブラウザ表示設定、CSP を混同せずに扱ってください。

---

## 現在の実装状況

現時点で実装済みのプロバイダーは以下です。

- `s3`: AWS S3 / LocalStack
- `s3-compatible`: `S3Provider` を再利用する S3 互換ストレージ
- `gcs`: Google Cloud Storage

`createStorageServiceInstance()` は `STORAGE_PROVIDER` を見て、以下のように切り替えます。

```ts
const providerName = process.env.STORAGE_PROVIDER ?? "s3";
```

許可される値は `s3 | s3-compatible | gcs` です。  
不正値は fallback せず、起動時に `Unknown STORAGE_PROVIDER` を throw します。

---

## 関連する主要 API

`src/libraries/storage.ts` には以下があります。

- `StorageService`
- `StorageProvider`
- `S3Provider`
- `GCSProvider`
- `StorageServiceImpl`
- `createS3ProviderConfig()`
- `createS3CompatibleProviderConfig()`
- `createGCSProviderConfig()`
- `createStorageServiceInstance()`

新しいプロバイダーを増やす場合も、まずは `StorageProvider` を満たせるかを確認してください。

---

## まず切り分けること

### 1. 保存先を変えたいのか

例:

- S3 の代わりに GCS を使いたい
- R2 / MinIO / Spaces に切り替えたい

この場合は `src/libraries/storage.ts`、`.env.example`、`README.md`、テストを更新します。

### 2. 画像を表示したいだけなのか

例:

- 既に保存済みの画像を `next/image` で表示したい
- CDN / 公開 URL をブラウザから読み込みたい

この場合は保存実装ではなく、主に以下を確認します。

- `EXTRA_REMOTE_IMAGE_URLS`
- `src/libraries/security-headers.ts`

ストレージプロバイダー追加だけではブラウザ表示は通りません。

---

## 現在サポートしている env

### S3 (`STORAGE_PROVIDER=s3`)

```bash
STORAGE_PROVIDER=s3
SYSTEM_AWS_S3_REGION=us-east-1
SYSTEM_AWS_ACCESS_KEY_ID=...
SYSTEM_AWS_SECRET_ACCESS_KEY=...
SYSTEM_AWS_S3_BUCKET=...
```

LocalStack を使う場合:

```bash
USE_LOCALSTACK=true
LOCALSTACK_ENDPOINT=http://localhost:4566
LOCALSTACK_PUBLIC_ENDPOINT=http://localhost:4566
```

`createS3ProviderConfig()` は `USE_LOCALSTACK=true` のとき path-style URL を使います。

### S3 Compatible (`STORAGE_PROVIDER=s3-compatible`)

```bash
STORAGE_PROVIDER=s3-compatible
SYSTEM_AWS_S3_REGION=us-east-1
SYSTEM_AWS_ACCESS_KEY_ID=...
SYSTEM_AWS_SECRET_ACCESS_KEY=...
SYSTEM_AWS_S3_BUCKET=...
S3_COMPATIBLE_ENDPOINT=https://...
S3_COMPATIBLE_PUBLIC_ENDPOINT=https://...
S3_COMPATIBLE_FORCE_PATH_STYLE=true
```

- `S3_COMPATIBLE_ENDPOINT` は必須です
- `S3_COMPATIBLE_PUBLIC_ENDPOINT` 省略時は `S3_COMPATIBLE_ENDPOINT` を使います
- `S3_COMPATIBLE_FORCE_PATH_STYLE` は `"true"` / `"false"` のみ受け付けます

対象例:

- Cloudflare R2
- MinIO
- DigitalOcean Spaces
- Wasabi

S3 互換で吸収できるサービスは、まず専用 provider を増やさず `S3Provider` 再利用を検討してください。

### GCS (`STORAGE_PROVIDER=gcs`)

```bash
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket
GCS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
GCS_REGION=us-central1
```

`createGCSProviderConfig()` は `GCS_PRIVATE_KEY` の `\n` を実改行へ復元します。

---

## URL の意味

`UploadResult.url` に何を入れるかは明示的に扱ってください。

現行実装では以下です。

- `s3`: AWS S3 の公開 URL、または LocalStack / custom endpoint の URL
- `s3-compatible`: `publicEndpoint` と `forcePathStyle` に基づく URL
- `gcs`: `https://storage.googleapis.com/<bucket>/<key>`

公開 URL、CDN URL、signed URL は同義ではありません。  
`UploadResult.url` を変更する場合は、表示側、CSP、`next/image` の許可設定も合わせて確認してください。

---

## `forcePathStyle` について

`S3Provider` は custom endpoint 使用時に `forcePathStyle` を明示設定できます。

- `true`: `https://endpoint/bucket/key`
- `false`: `https://bucket.endpoint/key`

過去は endpoint 指定時に `forcePathStyle` が実質常に `true` になる不具合がありましたが、現在は明示的な `false` を維持します。  
R2 の virtual-hosted-style endpoint などでは `false` が必要になることがあります。

`localhost` / MinIO / LocalStack のように bucket subdomain が解決されない環境では `false` を使うと `https://bucket.endpoint/key` がブラウザから到達できない場合があります。DNS または public endpoint が virtual-hosted-style に対応していない場合は `true` を使ってください。

---

## 新しいプロバイダーの追加手順

1. `StorageProvider` を満たす provider class を追加する
2. provider 専用 config interface / factory を追加する
3. `createStorageServiceInstance()` の `switch` に追加する
4. `.env.example` に env を追加する
5. `README.md` と本ガイドを更新する
6. `EXTRA_REMOTE_IMAGE_URLS` と CSP が必要かを確認する
7. テストを追加する

---

## テスト方針

最低でも以下を追加・更新します。

- `__tests__/libraries/storage.test.ts`
- provider 選択テスト
- env validation テスト
- URL 生成テスト
- upload / download / delete / list / signed URL のテスト
- consumer 側 smoke test

consumer 側では少なくとも `UserRepository` 経由の初期化が壊れていないことを確認してください。

---

## 追加時の注意

- env は fail fast に扱う
- `STORAGE_PROVIDER` の typo を黙って吸収しない
- S3 互換サービスに専用 provider を乱立させない
- 画像表示設定と保存実装を分けて考える
- `SYSTEM_AWS_*` 命名を維持する
