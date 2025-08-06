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
      console.log("S3Provider: Starting download for key:", key);
      console.log("S3Provider: Config:", {
        bucket: this.config.bucket,
        region: this.config.region,
        endpoint: this.config.endpoint,
        forcePathStyle: this.config.forcePathStyle,
      });

      const { GetObjectCommand } = await import("@aws-sdk/client-s3");

      const s3Client = await this.createS3Client();
      console.log("S3Provider: S3 client created successfully");

      const params = {
        Bucket: this.config.bucket,
        Key: key,
      };

      console.log("S3Provider: GetObjectCommand params:", params);
      const command = new GetObjectCommand(params);
      const result = await s3Client.send(command);

      console.log("S3Provider: GetObjectCommand result:", {
        hasBody: !!result.Body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        bodyType: typeof result.Body,
        bodyConstructor: result.Body?.constructor?.name,
      });

      if (!result.Body) {
        console.error("S3Provider: No data received from S3");
        return {
          success: false,
          error: "No data received",
        };
      }

      let data: Buffer;

      // Bodyの形式に応じてデータを取得
      if (result.Body instanceof Uint8Array) {
        // Uint8Arrayの場合
        console.log(
          "S3Provider: Body is Uint8Array, length:",
          result.Body.length
        );
        data = Buffer.from(result.Body);
      } else if (typeof result.Body === "string") {
        // 文字列の場合
        console.log(
          "S3Provider: Body is string, length:",
          (result.Body as string).length
        );
        data = Buffer.from(result.Body, "utf-8");
      } else if (
        result.Body &&
        typeof result.Body === "object" &&
        "getReader" in result.Body
      ) {
        // ReadableStreamの場合
        console.log("S3Provider: Body is ReadableStream, using getReader");
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
        // TransformStreamの場合
        console.log(
          "S3Provider: Body is TransformStream, using transformToByteArray"
        );
        const chunks: Uint8Array[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream = result.Body as any;

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        data = Buffer.concat(chunks);
      } else {
        // その他の場合、toString()を試す
        console.log("S3Provider: Body is unknown type, trying toString()");
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

      console.log(
        "S3Provider: Stream data converted to buffer, length:",
        data.length
      );

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
    console.log("StorageServiceImpl: Starting download for key:", key);
    console.log(
      "StorageServiceImpl: Provider type:",
      this.provider.constructor.name
    );

    const result = await this.provider.download(key);

    console.log("StorageServiceImpl: Download result:", {
      success: result.success,
      hasData: !!result.data,
      dataLength: result.data?.length,
      contentType: result.contentType,
      contentLength: result.contentLength,
      error: result.error,
    });

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

// Storage Service Factory
export function createStorageServiceInstance(): StorageService {
  console.log(
    "createStorageServiceInstance: Creating storage service instance"
  );

  // 常にS3プロバイダーを使用
  const s3Config = createS3ProviderConfig();
  console.log("createStorageServiceInstance: S3 config created:", {
    region: s3Config.region,
    bucket: s3Config.bucket,
    endpoint: s3Config.endpoint,
    forcePathStyle: s3Config.forcePathStyle,
    hasAccessKey: !!s3Config.accessKeyId,
    hasSecretKey: !!s3Config.secretAccessKey,
  });

  const provider = new S3Provider(s3Config);
  console.log("createStorageServiceInstance: S3Provider created");

  const service = new StorageServiceImpl(provider);
  console.log("createStorageServiceInstance: StorageServiceImpl created");

  return service;
}
