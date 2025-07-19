// Storage Service Interface
export interface StorageService {
  uploadFile(
    key: string,
    data: Buffer | Uint8Array,
    contentType?: string
  ): Promise<UploadResult>;
  downloadFile(key: string): Promise<DownloadResult>;
  generateSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  updateFile(
    key: string,
    data: Buffer | Uint8Array,
    contentType?: string
  ): Promise<UploadResult>;
  listFiles(prefix?: string, maxKeys?: number): Promise<ListResult>;
}

// Storage Provider Interface (for future extensibility)
export interface StorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  download(key: string): Promise<DownloadResult>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
  delete(key: string): Promise<void>;
  list(prefix?: string, maxKeys?: number): Promise<ListResult>;
}

// Upload Options Interface
export interface UploadOptions {
  key: string;
  data: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
}

// Upload Result Interface
export interface UploadResult {
  success: boolean;
  key: string;
  url?: string;
  error?: string;
}

// Download Result Interface
export interface DownloadResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  error?: string;
}

// List Result Interface
export interface ListResult {
  success: boolean;
  files: StorageFile[];
  hasMore: boolean;
  error?: string;
}

// Storage File Interface
export interface StorageFile {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

// S3 Provider Configuration
export interface S3ProviderConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string; // For LocalStack
  publicEndpoint?: string; // For browser access to LocalStack
  forcePathStyle?: boolean; // For LocalStack compatibility
}

// S3 Provider Implementation
export class S3Provider implements StorageProvider {
  private config: S3ProviderConfig;

  constructor(config: S3ProviderConfig) {
    this.config = config;
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      // Dynamic import for AWS SDK to ensure Edge Runtime compatibility
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");

      const s3Client = await this.createS3Client();

      const params = {
        Bucket: this.config.bucket,
        Key: options.key,
        Body: options.data,
        ContentType: options.contentType || "application/octet-stream",
        ...(options.metadata && { Metadata: options.metadata }),
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);

      const url = this.generateFileUrl(options.key);

      return {
        success: true,
        key: options.key,
        url,
      };
    } catch (error) {
      console.error("S3 upload failed:", error);
      return {
        success: false,
        key: options.key,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async download(key: string): Promise<DownloadResult> {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");

      const s3Client = await this.createS3Client();

      const params = {
        Bucket: this.config.bucket,
        Key: key,
      };

      const command = new GetObjectCommand(params);
      const result = await s3Client.send(command);

      if (!result.Body) {
        return {
          success: false,
          error: "No data received",
        };
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reader = (result.Body as any).getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const data = Buffer.concat(chunks);

      return {
        success: true,
        data,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
      };
    } catch (error) {
      console.error("S3 download failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const s3Client = await this.createS3Client();

      const params = {
        Bucket: this.config.bucket,
        Key: key,
      };

      const command = new GetObjectCommand(params);
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      console.error("S3 signed URL generation failed:", error);
      throw new Error(
        `Failed to generate signed URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

      const s3Client = await this.createS3Client();

      const params = {
        Bucket: this.config.bucket,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
    } catch (error) {
      console.error("S3 delete failed:", error);
      throw new Error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<ListResult> {
    try {
      const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");

      const s3Client = await this.createS3Client();

      const params = {
        Bucket: this.config.bucket,
        ...(prefix && { Prefix: prefix }),
        MaxKeys: maxKeys,
      };

      const command = new ListObjectsV2Command(params);
      const result = await s3Client.send(command);

      const files: StorageFile[] = (result.Contents || []).map(
        (object: {
          Key?: string;
          Size?: number;
          LastModified?: Date;
          ETag?: string;
        }) => ({
          key: object.Key!,
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
          etag: object.ETag,
        })
      );

      return {
        success: true,
        files,
        hasMore: result.IsTruncated || false,
      };
    } catch (error) {
      console.error("S3 list failed:", error);
      return {
        success: false,
        files: [],
        hasMore: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async createS3Client() {
    const { S3Client } = await import("@aws-sdk/client-s3");

    const clientConfig: {
      region: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
      endpoint?: string;
      forcePathStyle?: boolean;
    } = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    };

    // Add endpoint and path style for LocalStack if provided
    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
      clientConfig.forcePathStyle = this.config.forcePathStyle || true;
    }

    return new S3Client(clientConfig);
  }

  private generateFileUrl(key: string): string {
    if (this.config.endpoint) {
      // LocalStack or custom endpoint
      // Use publicEndpoint for browser access if available, otherwise fallback to endpoint
      const browserEndpoint =
        this.config.publicEndpoint || this.config.endpoint;

      if (this.config.forcePathStyle) {
        // Path-style URL for LocalStack: http://localhost:4566/bucket-name/key
        return `${browserEndpoint}/${this.config.bucket}/${key}`;
      } else {
        // Virtual-hosted style with custom endpoint
        const endpointUrl = new URL(browserEndpoint);
        return `${endpointUrl.protocol}//${this.config.bucket}.${endpointUrl.host}/${key}`;
      }
    } else {
      // Production AWS S3
      return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }
  }
}

// Local Storage Provider for Development (Node.js Runtime only)
export let LocalStorageProvider: new (basePath?: string) => StorageProvider;

// Node.js環境でのみLocalStorageProviderを定義
if (
  typeof process !== "undefined" &&
  typeof process.versions !== "undefined" &&
  typeof process.versions.node !== "undefined" &&
  process.env.NEXT_RUNTIME !== "edge"
) {
  LocalStorageProvider = class implements StorageProvider {
    private basePath: string;

    constructor(basePath: string = "./uploads") {
      this.basePath = basePath;
    }

    async upload(options: UploadOptions): Promise<UploadResult> {
      try {
        const { promises: fs } = await import("fs");
        const path = await import("path");

        const filePath = path.join(this.basePath, options.key);
        const dirPath = path.dirname(filePath);

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write file
        await fs.writeFile(filePath, options.data);

        return {
          success: true,
          key: options.key,
          url: `file://${filePath}`,
        };
      } catch (error) {
        console.error("Local storage upload failed:", error);
        return {
          success: false,
          key: options.key,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    async download(key: string): Promise<DownloadResult> {
      try {
        const { promises: fs } = await import("fs");
        const path = await import("path");

        const filePath = path.join(this.basePath, key);
        const data = await fs.readFile(filePath);
        const stats = await fs.stat(filePath);

        return {
          success: true,
          data,
          contentLength: stats.size,
          lastModified: stats.mtime,
        };
      } catch (error) {
        console.error("Local storage download failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
      // For local storage, return a simple file path URL
      // In a real implementation, you might want to implement a token-based system
      const path = await import("path");
      const filePath = path.join(this.basePath, key);
      return `file://${filePath}?expires=${Date.now() + expiresIn * 1000}`;
    }

    async delete(key: string): Promise<void> {
      try {
        const { promises: fs } = await import("fs");
        const path = await import("path");

        const filePath = path.join(this.basePath, key);
        await fs.unlink(filePath);
      } catch (error) {
        console.error("Local storage delete failed:", error);
        throw new Error(
          `Failed to delete file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    async list(prefix?: string, maxKeys: number = 1000): Promise<ListResult> {
      try {
        const { promises: fs } = await import("fs");
        const path = await import("path");

        const searchPath = prefix
          ? path.join(this.basePath, prefix)
          : this.basePath;

        const files: StorageFile[] = [];

        async function walk(dir: string, currentPrefix: string = "") {
          try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
              if (files.length >= maxKeys) break;

              const fullPath = path.join(dir, entry.name);
              const relativePath = path.join(currentPrefix, entry.name);

              if (entry.isDirectory()) {
                await walk(fullPath, relativePath);
              } else {
                const stats = await fs.stat(fullPath);
                files.push({
                  key: relativePath,
                  size: stats.size,
                  lastModified: stats.mtime,
                });
              }
            }
          } catch {
            // Directory might not exist, continue
          }
        }

        await walk(searchPath);

        return {
          success: true,
          files,
          hasMore: false, // Simple implementation doesn't support pagination
        };
      } catch (error) {
        console.error("Local storage list failed:", error);
        return {
          success: false,
          files: [],
          hasMore: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  };
}

// Main Storage Service Implementation
export class StorageServiceImpl implements StorageService {
  private provider: StorageProvider;

  constructor(provider: StorageProvider) {
    this.provider = provider;
  }

  async uploadFile(
    key: string,
    data: Buffer | Uint8Array,
    contentType?: string
  ): Promise<UploadResult> {
    const options: UploadOptions = {
      key,
      data,
      contentType,
    };

    const result = await this.provider.upload(options);

    if (result.success) {
      console.log(`File uploaded successfully: ${key}`);
    } else {
      console.error(`Failed to upload file ${key}:`, result.error);
    }

    return result;
  }

  async downloadFile(key: string): Promise<DownloadResult> {
    const result = await this.provider.download(key);

    if (result.success) {
      console.log(`File downloaded successfully: ${key}`);
    } else {
      console.error(`Failed to download file ${key}:`, result.error);
    }

    return result;
  }

  async generateSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const url = await this.provider.getSignedUrl(key, expiresIn);
    console.log(`Signed URL generated for ${key}, expires in ${expiresIn}s`);
    return url;
  }

  async deleteFile(key: string): Promise<void> {
    await this.provider.delete(key);
    console.log(`File deleted successfully: ${key}`);
  }

  async updateFile(
    key: string,
    data: Buffer | Uint8Array,
    contentType?: string
  ): Promise<UploadResult> {
    // Update is the same as upload for most storage providers
    return this.uploadFile(key, data, contentType);
  }

  async listFiles(prefix?: string, maxKeys?: number): Promise<ListResult> {
    const result = await this.provider.list(prefix, maxKeys);

    if (result.success) {
      console.log(
        `Listed ${result.files.length} files with prefix: ${prefix || "none"}`
      );
    } else {
      console.error(`Failed to list files:`, result.error);
    }

    return result;
  }
}

// Configuration Factory
export function createS3ProviderConfig(): S3ProviderConfig {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Production: Use AWS S3
    return {
      region: process.env.AWS_S3_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      bucket: process.env.AWS_S3_BUCKET || "",
    };
  } else {
    // Development: Use LocalStack S3
    return {
      region: process.env.AWS_S3_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
      bucket: process.env.AWS_S3_BUCKET || "test-bucket",
      endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
      publicEndpoint:
        process.env.LOCALSTACK_PUBLIC_ENDPOINT || "http://localhost:4566",
      forcePathStyle: true,
    };
  }
}

// Storage Service Factory
export function createStorageServiceInstance(): StorageService {
  // Edge Runtime環境の検出を改善
  const isEdgeRuntime =
    process.env.NEXT_RUNTIME === "edge" ||
    typeof process === "undefined" ||
    typeof process.versions === "undefined" ||
    typeof process.versions.node === "undefined";

  // Node.js Runtime環境の検出
  const isNodeRuntime =
    !isEdgeRuntime &&
    typeof process !== "undefined" &&
    typeof process.versions !== "undefined" &&
    typeof process.versions.node !== "undefined";

  // Edge Runtime環境では常にS3を使用
  if (isEdgeRuntime) {
    console.log("Edge Runtime detected, using S3 provider");
    const s3Config = createS3ProviderConfig();
    return new StorageServiceImpl(new S3Provider(s3Config));
  }

  // Node.js環境でのみローカルストレージの選択を許可
  const storageType = isNodeRuntime
    ? process.env.STORAGE_PROVIDER || "s3"
    : "s3";

  let provider: StorageProvider;

  switch (storageType) {
    case "local":
      if (!isNodeRuntime || !LocalStorageProvider) {
        console.warn(
          "LocalStorageProvider is not supported in non-Node.js runtime, falling back to S3"
        );
        const s3Config = createS3ProviderConfig();
        provider = new S3Provider(s3Config);
      } else {
        const localPath = process.env.LOCAL_STORAGE_PATH || "./uploads";
        provider = new LocalStorageProvider(localPath);
      }
      break;

    case "s3":
    default:
      const s3Config = createS3ProviderConfig();
      provider = new S3Provider(s3Config);
      break;
  }

  return new StorageServiceImpl(provider);
}
