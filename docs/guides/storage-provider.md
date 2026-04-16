# ストレージプロバイダー追加ガイド

このガイドは、このテンプレートに新しいクラウドストレージを追加する際の共通方針をまとめたものです。  
対象は AWS S3 だけでなく、Azure Blob Storage、Google Cloud Storage、Cloudflare R2、MinIO などの他プロバイダーを含みます。

Azure Blob / GCS は本ガイド内で具体例として扱いますが、内容自体は特定ベンダー専用ではありません。

---

## 現在の実装状況

現時点で実装済みなのは `src/libraries/storage.ts` の S3 系フローです。

- `StorageService`
- `StorageProvider`
- `S3Provider`
- `StorageServiceImpl`
- `createS3ProviderConfig()`
- `createStorageServiceInstance()` は現在 S3 を返す

このガイドにある Azure Blob / GCS の記述は「追加時の設計指針」であり、現時点で実装済みであることを意味しません。

---

## まず切り分けること

新しいストレージを使いたい、という要望には少なくとも 2 種類あります。

### 1. 画像やファイルを表示したいだけ

例:

- GCS 上の画像を `next/image` で表示したい
- Azure Blob 上のアバター URL をブラウザで読み込みたい

この場合に必要なのは、主に表示側の設定です。

- `EXTRA_REMOTE_IMAGE_URLS` で `next/image` の許可ホストを追加する
- 必要なら `src/libraries/security-headers.ts` の CSP を調整する

ストレージ保存処理そのものは変えなくてよいことがあります。

### 2. 保存先プロバイダーそのものを切り替えたい

例:

- S3 の代わりに Azure Blob をアップロード先にしたい
- GCS を正式な保存先として使いたい
- MinIO / R2 / S3 互換 endpoint に切り替えたい

この場合は `src/libraries/storage.ts` の provider 実装、設定 factory、環境変数、テスト、ドキュメントの更新が必要です。

---

## 変更が必要な主なファイル

### `src/libraries/storage.ts`

最重要です。以下を確認します。

- `StorageProvider` interface を満たせるか
- provider 固有 config をどう表現するか
- `createStorageServiceInstance()` でどう切り替えるか
- provider が返す `url` の意味をどうするか
  - 公開 URL
  - CDN URL
  - 短期 signed URL

### `.env.example`

新しい provider に必要な env を追加します。  
未設定時の挙動は黙って fallback させず、可能な限り fail fast で扱います。

### `README.md`

利用者が必要な env、保存先の前提、画像表示設定の必要有無を追えるようにします。

### `next.config.ts`

`next/image` を使うなら、外部ホストの許可設定が必要です。  
このテンプレートでは `EXTRA_REMOTE_IMAGE_URLS` から `remotePatterns` を生成しています。

### `src/libraries/security-headers.ts`

画像や API を production で外部ホストから読むなら、CSP の `img-src` / `connect-src` が足りるか確認します。

### テスト

最低でも以下を更新します。

- `__tests__/libraries/storage.test.ts`
- provider factory を見るテスト
- URL / signed URL / env validation のテスト
- provider を使う repository / action の既存テスト

---

## 実装時の共通チェックリスト

### 1. provider の性質を整理する

次を最初に決めます。

- 公開 URL をそのまま返せるか
- 読み取りに signed URL が必須か
- upload / download / delete / list をすべて持つか
- SDK を使うか、HTTP API を叩くか
- Node.js runtime 前提か、Edge runtime も意識するか

### 2. URL の役割を分けて考える

`UploadResult.url` に何を入れるかを曖昧にしないでください。

候補は別物です。

- ブラウザからそのまま見える公開 URL
- CDN の配信 URL
- 内部保存先 URL
- 時限付き signed URL

このテンプレートでは、表示に使う URL と保存先の実体を混同すると、`next/image` 設定と CSP の両方で事故ります。

### 3. env は厳格に扱う

plan 001 の SSL 設定と同様、曖昧な env を黙って飲み込まない方針を取ります。

- 必須 env がなければ明示的にエラー
- boolean 文字列は `"true"` / `"false"` を明示解釈
- provider 種別は許可値のみ受け入れる
- typo を fallback で隠さない

### 4. S3 互換なら専用実装を増やしすぎない

R2 / MinIO / DigitalOcean Spaces など、S3 互換で吸収できるものは新 provider を増やす前に既存 `S3Provider` で扱えないかを先に検討します。

追加 env のみで対応できるなら、その方が保守しやすいです。

### 5. 表示設定と保存実装を分ける

新しい保存先を追加しても、画像表示のためには別途次を確認します。

- `EXTRA_REMOTE_IMAGE_URLS`
- `src/libraries/security-headers.ts`

保存実装を追加しただけでは、ブラウザ表示は通りません。

---

## provider 追加の実装フロー

1. `StorageProvider` を満たす provider class を追加する
2. provider 専用 config interface / factory を追加する
3. `createStorageServiceInstance()` で provider 切り替えを実装する
4. `.env.example` に env を追加する
5. `README.md` と本ガイドを更新する
6. `EXTRA_REMOTE_IMAGE_URLS` や CSP が必要か確認する
7. provider 単体テストと factory テストを追加する
8. 既存のアップロード利用箇所に回帰がないか確認する

---

## 実装パターン

### パターン A: S3 互換 endpoint で吸収する

対象例:

- Cloudflare R2
- MinIO
- DigitalOcean Spaces

この場合は、既存 `S3Provider` を流用し、追加 env で次を調整する方向が第一候補です。

- endpoint
- public endpoint
- force path style
- region
- bucket

新しい provider class は不要なことがあります。

### パターン B: 専用 SDK / HTTP API を使う

対象例:

- Google Cloud Storage
- Azure Blob Storage

この場合は専用 provider 実装を追加する方が自然です。

---

## Google Cloud Storage の例

GCS は S3 互換ではないため、通常は専用 provider を追加します。

### env 例

```bash
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
GCS_REGION=us-central1
```

### 実装時の論点

- `@google-cloud/storage` を使うか
- `GCS_PRIVATE_KEY` の `\n` を実改行へ復元するか
- 公開 URL を `https://storage.googleapis.com/<bucket>/<key>` にするか
- signed URL を標準にするか
- バケット公開前提にしないか

### 画像表示設定の例

```bash
EXTRA_REMOTE_IMAGE_URLS=https://storage.googleapis.com/your-bucket/,https://your-bucket.storage.googleapis.com/
```

### 注意

GCS を保存先として実装しても、production でその URL をブラウザ表示するなら CSP の `img-src` 側も要確認です。  
現状のテンプレートは `https:` を許可しているため、多くのケースでは追加変更不要ですが、署名付き API や別ドメイン通信を伴う場合は `connect-src` を含めて見直します。

---

## Azure Blob Storage の例

Azure Blob も専用 provider 追加が自然です。

### env 例

```bash
STORAGE_PROVIDER=azure-blob
AZURE_STORAGE_ACCOUNT=your-account
AZURE_STORAGE_CONTAINER=your-container
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_SAS_TOKEN=
```

### 実装時の論点

- 接続文字列を使うか、account + credential に分けるか
- SAS URL を返すか、SDK で signed URL を組み立てるか
- container を public にするか
- URL を `https://<account>.blob.core.windows.net/<container>/<key>` にするか

### 画像表示設定の例

```bash
EXTRA_REMOTE_IMAGE_URLS=https://your-account.blob.core.windows.net/your-container/
```

### 注意

SAS 付き URL は query string を伴いますが、`next/image` 側は host / path の許可が通っていれば読み込み可能です。  
一方で、公開 URL と signed URL をどちらで扱うかを曖昧にすると、キャッシュ戦略や URL 期限切れで不具合になりやすいので、方針を先に固定してください。

---

## 実装時のサンプル骨格

```typescript
export interface ExampleProviderConfig {
  bucket: string;
  endpoint?: string;
  credential: string;
}

export class ExampleProvider implements StorageProvider {
  constructor(private readonly config: ExampleProviderConfig) {
    if (!config.bucket) {
      throw new Error("Example bucket is required");
    }
    if (!config.credential) {
      throw new Error("Example credential is required");
    }
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    // provider 固有 upload
    return {
      success: true,
      key: options.key,
      url: "https://example.invalid/file",
    };
  }

  async download(key: string): Promise<DownloadResult> {
    // provider 固有 download
    return { success: false, error: `Not implemented: ${key}` };
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // provider 固有 signed URL
    throw new Error(`Not implemented: ${key} (${expiresIn})`);
  }

  async delete(key: string): Promise<void> {
    // provider 固有 delete
    void key;
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<ListResult> {
    void prefix;
    void maxKeys;
    return { success: true, files: [], hasMore: false };
  }
}
```

---

## テスト観点

最低限、以下は自動テストに入れます。

- provider factory が正しい provider を返す
- 必須 env 不足時に明示的エラーになる
- upload 成功時に `UploadResult.url` が期待どおり
- signed URL の生成ロジック
- download / delete / list の正常系と失敗系
- `EXTRA_REMOTE_IMAGE_URLS` に必要な URL 例が README / `.env.example` と矛盾しない

必要に応じて以下も見ます。

- repository 層で avatar URL 取得が壊れない
- 既存のアップロード action が回帰しない
- provider 切替後も LocalStack 開発フローを壊していない

---

## ドキュメント更新の基準

新 provider を入れたら、少なくとも次を同期します。

- `.env.example`
- `README.md`
- `docs/guides/storage-provider.md`
- 必要なら `documents/plans/20260414-refactoring-plan-003.md`

---

## まとめ

新しいクラウドストレージを追加するときは、単に SDK を足すだけでは不十分です。  
このテンプレートでは次の 3 つを常に分けて考えます。

1. 保存実装
2. ブラウザ表示 (`next/image`)
3. CSP / セキュリティヘッダ

GCS / Azure Blob はその代表例であり、他のクラウドストレージでも同じ観点で判断してください。
