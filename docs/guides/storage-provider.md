# ストレージプロバイダー追加ガイド

既存のストレージサービスに新プロバイダーを追加する方法。

## 現在のアーキテクチャ

```
src/libraries/storage.ts
├── StorageService (interface)
├── StorageProvider (interface)
├── S3Provider (class)
├── LocalStorageProvider (class)
└── StorageServiceImpl (class)
```

## 追加手順

### 1. 設定インターフェース

```typescript
export interface GCSProviderConfig {
  projectId: string;
  bucket: string;
  credentials: {
    clientEmail: string;
    privateKey: string;
  };
  region?: string;
}
```

### 2. プロバイダークラス

```typescript
export class GCSProvider implements StorageProvider {
  private config: GCSProviderConfig;
  constructor(config: GCSProviderConfig) { this.config = config; }

  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const { Storage } = await import("@google-cloud/storage");
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      const bucket = storage.bucket(this.config.bucket);
      const file = bucket.file(options.key);
      await file.save(options.data, {
        metadata: {
          contentType: options.contentType || "application/octet-stream",
          ...options.metadata,
        },
      });
      return {
        success: true,
        key: options.key,
        url: `https://storage.googleapis.com/${this.config.bucket}/${options.key}`,
      };
    } catch (error) {
      console.error("GCS upload failed:", error);
      return {
        success: false,
        key: options.key,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async download(key: string): Promise<DownloadResult> {
    try {
      const { Storage } = await import("@google-cloud/storage");
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      const file = storage.bucket(this.config.bucket).file(key);
      const [data] = await file.download();
      const [metadata] = await file.getMetadata();
      return {
        success: true,
        data: Buffer.from(data),
        contentType: metadata.contentType,
        contentLength: parseInt(metadata.size),
        lastModified: new Date(metadata.updated),
      };
    } catch (error) {
      console.error("GCS download failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const { Storage } = await import("@google-cloud/storage");
    const storage = new Storage({
      projectId: this.config.projectId,
      credentials: this.config.credentials,
    });
    const [signedUrl] = await storage
      .bucket(this.config.bucket)
      .file(key)
      .getSignedUrl({ action: "read", expires: Date.now() + expiresIn * 1000 });
    return signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { Storage } = await import("@google-cloud/storage");
    const storage = new Storage({
      projectId: this.config.projectId,
      credentials: this.config.credentials,
    });
    await storage.bucket(this.config.bucket).file(key).delete();
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<ListResult> {
    try {
      const { Storage } = await import("@google-cloud/storage");
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      const [files] = await storage
        .bucket(this.config.bucket)
        .getFiles({ prefix, maxResults: maxKeys });
      return {
        success: true,
        files: files.map((f) => ({
          key: f.name,
          size: parseInt(f.metadata.size),
          lastModified: new Date(f.metadata.updated),
          etag: f.metadata.etag,
        })),
        hasMore: files.length === maxKeys,
      };
    } catch (error) {
      console.error("GCS list failed:", error);
      return {
        success: false,
        files: [],
        hasMore: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
```

### 3. 設定ファクトリー

```typescript
export function createGCSProviderConfig(): GCSProviderConfig {
  return {
    projectId: process.env.GCS_PROJECT_ID || "",
    bucket: process.env.GCS_BUCKET || "",
    credentials: {
      clientEmail: process.env.GCS_CLIENT_EMAIL || "",
      privateKey: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    },
    region: process.env.GCS_REGION,
  };
}
```

### 4. メインファクトリー更新

```typescript
export function createStorageServiceInstance(): StorageService {
  const isEdgeRuntime =
    process.env.NEXT_RUNTIME === "edge" ||
    typeof process === "undefined" ||
    typeof process.versions === "undefined" ||
    typeof process.versions.node === "undefined";

  const isNodeRuntime = !isEdgeRuntime &&
    typeof process !== "undefined" &&
    typeof process.versions?.node !== "undefined";

  if (isEdgeRuntime) {
    return new StorageServiceImpl(new S3Provider(createS3ProviderConfig()));
  }

  const storageType = isNodeRuntime ? process.env.STORAGE_PROVIDER || "s3" : "s3";
  let provider: StorageProvider;

  switch (storageType) {
    case "gcs":
      provider = new GCSProvider(createGCSProviderConfig());
      break;
    case "local":
      if (!isNodeRuntime || !LocalStorageProvider) {
        provider = new S3Provider(createS3ProviderConfig());
      } else {
        provider = new LocalStorageProvider(process.env.LOCAL_STORAGE_PATH || "./uploads");
      }
      break;
    case "s3":
    default:
      provider = new S3Provider(createS3ProviderConfig());
      break;
  }
  return new StorageServiceImpl(provider);
}
```

### 5. 環境変数

```bash
STORAGE_PROVIDER=s3 # s3, gcs, local, etc.

GCS_PROJECT_ID=your-gcs-project-id
GCS_BUCKET=your-gcs-bucket-name
GCS_CLIENT_EMAIL=your-service-account-email
GCS_PRIVATE_KEY=your-private-key
GCS_REGION=us-central1
```

### 6. 依存追加

```bash
npm install @google-cloud/storage
```

## 実装の注意点

### Edge Runtime 対応

- Dynamic Import を使用
- HTTP ベースの API を選択
- 可能なら `fetch()` 直接

### エラーハンドリング

- `UploadResult` / `DownloadResult` / `ListResult` 形式で返す
- エラーは適切にログ出力、`success: false`
- ネットワーク・認証エラーなどを考慮

### 設定の検証

```typescript
constructor(config: GCSProviderConfig) {
  if (!config.projectId) throw new Error("GCS project ID is required");
  if (!config.bucket) throw new Error("GCS bucket is required");
  if (!config.credentials.clientEmail || !config.credentials.privateKey) {
    throw new Error("GCS credentials are required");
  }
  this.config = config;
}
```

## テスト

### 単体

```typescript
describe("GCSProvider", () => {
  it("should upload file successfully", async () => {
    const provider = new GCSProvider({ /* ... */ });
    const result = await provider.upload({
      key: "test/file.txt",
      data: Buffer.from("test content"),
      contentType: "text/plain",
    });
    expect(result.success).toBe(true);
  });
});
```

### 統合

1. `.env` で `STORAGE_PROVIDER=gcs`
2. ファイルアップロード機能で実操作テスト
3. ログで結果確認

## 利用可能プロバイダー例

### Edge Runtime 対応

- **AWS S3**: 現行実装
- **Google Cloud Storage**: HTTP API
- **Azure Blob Storage**: HTTP API
- **Cloudflare R2**: S3 互換

### Node.js Runtime のみ

- **LocalStorageProvider**: 現行実装
- **MinIO**: S3 互換
- **DigitalOcean Spaces**: S3 互換

## 既存コードへの影響

変更不要：

- `StorageService` インターフェース
- `StorageServiceImpl` クラス
- 既存の `S3Provider` / `LocalStorageProvider`
- ファイルアップロード機能の実装

切替は `STORAGE_PROVIDER` 環境変数のみ。

## 使用例

### 基本

```typescript
import { createStorageServiceInstance } from "@/libraries/storage";
const storageService = createStorageServiceInstance();

// Upload
const r = await storageService.uploadFile("documents/report.pdf", fileBuffer, "application/pdf");
if (r.success) console.log("File uploaded:", r.url);

// Download
const d = await storageService.downloadFile("documents/report.pdf");

// Signed URL
const url = await storageService.generateSignedUrl("documents/report.pdf", 3600);

// Delete
await storageService.deleteFile("documents/report.pdf");

// List
const list = await storageService.listFiles("documents/", 100);
```

### Server Action

```typescript
"use server";

import { createStorageServiceInstance } from "@/libraries/storage";

export async function uploadDocumentAction(formData: FormData) {
  const storage = createStorageServiceInstance();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `documents/${Date.now()}-${file.name}`;
  const result = await storage.uploadFile(key, buffer, file.type);
  if (!result.success) throw new Error("Failed to upload file");
  return { success: true, url: result.url };
}
```

## 環境別設定例

### 開発（LocalStack）

```bash
STORAGE_PROVIDER=s3
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=test-bucket
LOCALSTACK_ENDPOINT=http://localhost:4566
LOCALSTACK_PUBLIC_ENDPOINT=http://localhost:4566
```

### 本番（AWS S3）

```bash
STORAGE_PROVIDER=s3
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-production-bucket
```

### 本番（GCS）

```bash
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
GCS_REGION=us-central1
```
