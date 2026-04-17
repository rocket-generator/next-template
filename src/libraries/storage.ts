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

export interface GCSProviderConfig {
  projectId: string;
  bucket: string;
  credentials: {
    clientEmail: string;
    privateKey: string;
  };
  region?: string;
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

      let data: Buffer;

      // Bodyの形式に応じてデータを取得
      if (result.Body instanceof Uint8Array) {
        data = Buffer.from(result.Body);
      } else if (typeof result.Body === "string") {
        data = Buffer.from(result.Body, "utf-8");
      } else if (
        result.Body &&
        typeof result.Body === "object" &&
        "getReader" in result.Body
      ) {
        const chunks: Uint8Array[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reader = (result.Body as any).getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        data = Buffer.concat(chunks);
      } else if (
        result.Body &&
        typeof result.Body === "object" &&
        "transformToByteArray" in result.Body
      ) {
        const chunks: Uint8Array[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream = result.Body as any;

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        data = Buffer.concat(chunks);
      } else {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bodyString = (result.Body as any).toString();
          data = Buffer.from(bodyString, "utf-8");
        } catch (error) {
          console.error("S3Provider: Failed to convert Body to string:", error);
          return {
            success: false,
            error: `Unsupported Body type: ${typeof result.Body}`,
          };
        }
      }

      return {
        success: true,
        data,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
      };
    } catch (error) {
      console.error("S3Provider: Download failed:", {
        key,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          bucket: this.config.bucket,
          region: this.config.region,
          endpoint: this.config.endpoint,
        },
      });
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
      if (this.config.forcePathStyle !== undefined) {
        clientConfig.forcePathStyle = this.config.forcePathStyle;
      }
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

export class GCSProvider implements StorageProvider {
  private config: GCSProviderConfig;

  constructor(config: GCSProviderConfig) {
    if (!config.projectId) {
      throw new Error("GCS project ID is required");
    }
    if (!config.bucket) {
      throw new Error("GCS bucket is required");
    }
    if (!config.credentials.clientEmail || !config.credentials.privateKey) {
      throw new Error("GCS credentials are required");
    }

    this.config = config;
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const file = await this.getFileHandle(options.key);

      await file.save(options.data, {
        contentType: options.contentType || "application/octet-stream",
        metadata: options.metadata ? { metadata: options.metadata } : undefined,
      });

      return {
        success: true,
        key: options.key,
        url: this.generateFileUrl(options.key),
      };
    } catch (error) {
      return {
        success: false,
        key: options.key,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async download(key: string): Promise<DownloadResult> {
    try {
      const file = await this.getFileHandle(key);
      const [data] = await file.download();
      const [metadata] = await file.getMetadata();

      return {
        success: true,
        data,
        contentType: metadata.contentType,
        contentLength: metadata.size ? Number(metadata.size) : undefined,
        lastModified: metadata.updated ? new Date(metadata.updated) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    try {
      const file = await this.getFileHandle(key);
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresIn * 1000,
      });

      return signedUrl;
    } catch (error) {
      throw new Error(
        `Failed to generate signed URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const file = await this.getFileHandle(key);
      await file.delete();
    } catch (error) {
      throw new Error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<ListResult> {
    try {
      const bucket = await this.getBucketHandle();
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: maxKeys,
        autoPaginate: false,
      });

      return {
        success: true,
        files: files.map((file) => ({
          key: file.name,
          size: file.metadata.size ? Number(file.metadata.size) : 0,
          lastModified: file.metadata.updated
            ? new Date(file.metadata.updated)
            : new Date(),
          etag: file.metadata.etag,
        })),
        hasMore: files.length === maxKeys,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        hasMore: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async getBucketHandle() {
    const { Storage } = await import("@google-cloud/storage");

    return new Storage({
      projectId: this.config.projectId,
      credentials: {
        client_email: this.config.credentials.clientEmail,
        private_key: this.config.credentials.privateKey,
      },
    }).bucket(this.config.bucket);
  }

  private async getFileHandle(key: string) {
    const bucket = await this.getBucketHandle();
    return bucket.file(key);
  }

  private generateFileUrl(key: string): string {
    return `https://storage.googleapis.com/${this.config.bucket}/${key}`;
  }
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
    if (!result.success) {
      console.error(`Failed to upload file ${key}:`, result.error);
    }

    return result;
  }

  async downloadFile(key: string): Promise<DownloadResult> {
    const result = await this.provider.download(key);
    if (!result.success) {
      console.error(`Failed to download file ${key}:`, result.error);
    }

    return result;
  }

  async generateSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    return this.provider.getSignedUrl(key, expiresIn);
  }

  async deleteFile(key: string): Promise<void> {
    await this.provider.delete(key);
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
    if (!result.success) {
      console.error(`Failed to list files:`, result.error);
    }

    return result;
  }
}

// Configuration Factory
export function createS3ProviderConfig(): S3ProviderConfig {
  const useLocalStack = process.env.USE_LOCALSTACK === "true";

  if (useLocalStack) {
    // LocalStack: Use LocalStack S3
    return {
      region: process.env.SYSTEM_AWS_S3_REGION || "us-east-1",
      accessKeyId: process.env.SYSTEM_AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.SYSTEM_AWS_SECRET_ACCESS_KEY || "test",
      bucket: process.env.SYSTEM_AWS_S3_BUCKET || "test-bucket",
      endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
      publicEndpoint:
        process.env.LOCALSTACK_PUBLIC_ENDPOINT || "http://localhost:4566",
      forcePathStyle: true,
    };
  } else {
    // Production: Use AWS S3
    return {
      region: process.env.SYSTEM_AWS_S3_REGION || "us-east-1",
      accessKeyId: process.env.SYSTEM_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.SYSTEM_AWS_SECRET_ACCESS_KEY || "",
      bucket: process.env.SYSTEM_AWS_S3_BUCKET || "",
    };
  }
}

function parseBooleanEnv(
  name: string,
  defaultValue?: boolean
): boolean | undefined {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }

  throw new Error(
    `Invalid boolean environment variable ${name}: expected "true" or "false"`
  );
}

export function createS3CompatibleProviderConfig(): S3ProviderConfig {
  const endpoint = process.env.S3_COMPATIBLE_ENDPOINT;

  if (!endpoint) {
    throw new Error(
      "Missing required environment variable: S3_COMPATIBLE_ENDPOINT"
    );
  }

  return {
    region: process.env.SYSTEM_AWS_S3_REGION || "us-east-1",
    accessKeyId: process.env.SYSTEM_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SYSTEM_AWS_SECRET_ACCESS_KEY || "",
    bucket: process.env.SYSTEM_AWS_S3_BUCKET || "",
    endpoint,
    publicEndpoint: process.env.S3_COMPATIBLE_PUBLIC_ENDPOINT || endpoint,
    forcePathStyle: parseBooleanEnv("S3_COMPATIBLE_FORCE_PATH_STYLE", true),
  };
}

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

// Storage Service Factory
export function createStorageServiceInstance(): StorageService {
  const providerName = process.env.STORAGE_PROVIDER ?? "s3";

  switch (providerName) {
    case "s3":
      return new StorageServiceImpl(new S3Provider(createS3ProviderConfig()));
    case "s3-compatible":
      return new StorageServiceImpl(
        new S3Provider(createS3CompatibleProviderConfig())
      );
    case "gcs":
      return new StorageServiceImpl(new GCSProvider(createGCSProviderConfig()));
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${providerName}`);
  }
}
