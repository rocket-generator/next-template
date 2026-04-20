import {
  StorageService,
  StorageProvider,
  S3Provider,
  StorageServiceImpl,
  createS3ProviderConfig,
  createStorageServiceInstance,
} from "@/libraries/storage";
import {
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

const mockGcsSave = jest.fn();
const mockGcsDownload = jest.fn();
const mockGcsGetMetadata = jest.fn();
const mockGcsGetSignedUrl = jest.fn();
const mockGcsDelete = jest.fn();
const mockGcsGetFiles = jest.fn();
const mockGcsFile = jest.fn(() => ({
  save: mockGcsSave,
  download: mockGcsDownload,
  getMetadata: mockGcsGetMetadata,
  getSignedUrl: mockGcsGetSignedUrl,
  delete: mockGcsDelete,
}));
const mockGcsBucket = jest.fn(() => ({
  file: mockGcsFile,
  getFiles: mockGcsGetFiles,
}));

// Mock AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn(() => ({
    bucket: mockGcsBucket,
  })),
}));

type StorageModule = typeof import("@/libraries/storage") & {
  createS3CompatibleProviderConfig?: () => unknown;
  createGCSProviderConfig?: () => unknown;
  GCSProvider?: new (...args: unknown[]) => StorageProvider;
};

const loadStorageModule = () => require("@/libraries/storage") as StorageModule;

describe("Storage Library", () => {
  const testKey = "test/file.txt";
  const testData = Buffer.from("test content");
  const testContentType = "text/plain";

  beforeEach(() => {
    installTestLoggerAdapters();
    mockGcsSave.mockReset();
    mockGcsDownload.mockReset();
    mockGcsGetMetadata.mockReset();
    mockGcsGetSignedUrl.mockReset();
    mockGcsDelete.mockReset();
    mockGcsGetFiles.mockReset();
    mockGcsFile.mockClear();
    mockGcsBucket.mockClear();
  });

  afterEach(() => {
    resetTestLoggerState();
  });

  describe("S3Provider", () => {
    let provider: S3Provider;
    let mockS3Client: jest.Mocked<any>;
    let mockSend: jest.Mock;

    beforeEach(() => {
      const { S3Client } = jest.requireMock("@aws-sdk/client-s3") as {
        S3Client: jest.Mock;
      };
      mockSend = jest.fn();
      mockS3Client = {
        send: mockSend,
      };
      S3Client.mockImplementation(() => mockS3Client);

      provider = new S3Provider({
        region: "us-east-1",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "test-bucket",
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("upload", () => {
      it("should upload file successfully", async () => {
        mockSend.mockResolvedValue({
          ETag: '"test-etag"',
        });

        const result = await provider.upload({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });

        expect(result.success).toBe(true);
        expect(result.key).toBe(testKey);
        expect(result.url).toContain(testKey);
        expect(mockSend).toHaveBeenCalledTimes(1);
      });

      it("should handle upload failure", async () => {
        mockSend.mockRejectedValue(new Error("Upload failed"));

        const result = await provider.upload({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Upload failed");
        expect(getLoggedEntries()).toContainEqual(
          expect.objectContaining({
            level: "error",
            scope: "storage",
            event: "storage.upload.failed",
            context: expect.objectContaining({
              operation: "upload",
              provider: "s3",
              bucket: "test-bucket",
              region: "us-east-1",
              key: testKey,
            }),
          })
        );
      });

      it("should include metadata when provided", async () => {
        mockSend.mockResolvedValue({
          ETag: '"test-etag"',
        });

        const result = await provider.upload({
          key: testKey,
          data: testData,
          contentType: testContentType,
          metadata: { custom: "value" },
        });

        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalledTimes(1);
      });

      it("should preserve forcePathStyle false when custom endpoint is used", async () => {
        provider = new S3Provider({
          region: "us-east-1",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucket: "test-bucket",
          endpoint: "https://storage.example.test",
          publicEndpoint: "https://cdn.example.test",
          forcePathStyle: false,
        });

        mockSend.mockResolvedValue({
          ETag: '"test-etag"',
        });

        const result = await provider.upload({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });

        const { S3Client } = jest.requireMock("@aws-sdk/client-s3") as {
          S3Client: jest.Mock;
        };

        expect(result.success).toBe(true);
        expect(S3Client).toHaveBeenCalledWith(
          expect.objectContaining({
            endpoint: "https://storage.example.test",
            forcePathStyle: false,
          })
        );
        expect(result.url).toBe("https://test-bucket.cdn.example.test/test/file.txt");
      });
    });

    describe("download", () => {
      it("should download file successfully", async () => {
        const mockReader = {
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array([116, 101, 115, 116]),
            })
            .mockResolvedValueOnce({ done: true }),
        };

        mockSend.mockResolvedValue({
          Body: { getReader: () => mockReader },
          ContentType: testContentType,
          ContentLength: 4,
          LastModified: new Date("2024-01-01"),
        });

        const result = await provider.download(testKey);

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Buffer);
        expect(result.contentType).toBe(testContentType);
        expect(result.contentLength).toBe(4);
        expect(result.lastModified).toEqual(new Date("2024-01-01"));
      });

      it("should handle download failure", async () => {
        mockSend.mockRejectedValue(new Error("Download failed"));

        const result = await provider.download(testKey);

        expect(result.success).toBe(false);
        expect(result.error).toBe("Download failed");
        expect(getLoggedEntries()).toContainEqual(
          expect.objectContaining({
            level: "error",
            scope: "storage",
            event: "storage.download.failed",
            context: expect.objectContaining({
              operation: "download",
              provider: "s3",
              bucket: "test-bucket",
              region: "us-east-1",
              key: testKey,
            }),
          })
        );
      });

      it("should handle missing body", async () => {
        mockSend.mockResolvedValue({ Body: null });

        const result = await provider.download(testKey);

        expect(result.success).toBe(false);
        expect(result.error).toBe("No data received");
      });
    });

    describe("getSignedUrl", () => {
      it("should generate signed URL successfully", async () => {
        const { getSignedUrl } = jest.requireMock(
          "@aws-sdk/s3-request-presigner"
        ) as {
          getSignedUrl: jest.Mock;
        };
        getSignedUrl.mockResolvedValue("https://signed-url.com");

        const result = await provider.getSignedUrl(testKey, 3600);

        expect(result).toBe("https://signed-url.com");
        expect(getSignedUrl).toHaveBeenCalledTimes(1);
      });

      it("should handle signed URL generation failure", async () => {
        const { getSignedUrl } = jest.requireMock(
          "@aws-sdk/s3-request-presigner"
        ) as {
          getSignedUrl: jest.Mock;
        };
        getSignedUrl.mockRejectedValue(new Error("URL generation failed"));

        await expect(provider.getSignedUrl(testKey, 3600)).rejects.toThrow(
          "URL generation failed"
        );
        expect(getLoggedEntries()).toContainEqual(
          expect.objectContaining({
            level: "error",
            scope: "storage",
            event: "storage.signed_url.failed",
            context: expect.objectContaining({
              operation: "getSignedUrl",
              provider: "s3",
              bucket: "test-bucket",
              region: "us-east-1",
              key: testKey,
            }),
          })
        );
      });
    });

    describe("delete", () => {
      it("should delete file successfully", async () => {
        mockSend.mockResolvedValue({});

        await expect(provider.delete(testKey)).resolves.not.toThrow();
        expect(mockSend).toHaveBeenCalledTimes(1);
      });

      it("should handle delete failure", async () => {
        mockSend.mockRejectedValue(new Error("Delete failed"));

        await expect(provider.delete(testKey)).rejects.toThrow("Delete failed");
        expect(getLoggedEntries()).toContainEqual(
          expect.objectContaining({
            level: "error",
            scope: "storage",
            event: "storage.delete.failed",
            context: expect.objectContaining({
              operation: "delete",
              provider: "s3",
              bucket: "test-bucket",
              region: "us-east-1",
              key: testKey,
            }),
          })
        );
      });
    });

    describe("list", () => {
      it("should list files successfully", async () => {
        mockSend.mockResolvedValue({
          Contents: [
            {
              Key: "file1.txt",
              Size: 100,
              LastModified: new Date("2024-01-01"),
              ETag: '"etag1"',
            },
            {
              Key: "file2.txt",
              Size: 200,
              LastModified: new Date("2024-01-02"),
              ETag: '"etag2"',
            },
          ],
          IsTruncated: false,
        });

        const result = await provider.list("prefix/");

        expect(result.success).toBe(true);
        expect(result.files).toHaveLength(2);
        expect(result.files[0].key).toBe("file1.txt");
        expect(result.files[0].size).toBe(100);
        expect(result.hasMore).toBe(false);
      });

      it("should handle list failure", async () => {
        mockSend.mockRejectedValue(new Error("List failed"));

        const result = await provider.list("prefix/");

        expect(result.success).toBe(false);
        expect(result.error).toBe("List failed");
        expect(getLoggedEntries()).toContainEqual(
          expect.objectContaining({
            level: "error",
            scope: "storage",
            event: "storage.list.failed",
            context: expect.objectContaining({
              operation: "list",
              provider: "s3",
              bucket: "test-bucket",
              region: "us-east-1",
              prefix: "prefix/",
            }),
          })
        );
      });

      it("should handle empty list", async () => {
        mockSend.mockResolvedValue({
          Contents: [],
          IsTruncated: false,
        });

        const result = await provider.list("prefix/");

        expect(result.success).toBe(true);
        expect(result.files).toHaveLength(0);
        expect(result.hasMore).toBe(false);
      });
    });
  });

  describe("StorageServiceImpl", () => {
    let service: StorageService;
    let mockProvider: jest.Mocked<StorageProvider>;

    beforeEach(() => {
      mockProvider = {
        upload: jest.fn(),
        download: jest.fn(),
        getSignedUrl: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
      };
      service = new StorageServiceImpl(mockProvider);
    });

    describe("uploadFile", () => {
      it("should call provider upload method", async () => {
        const expectedResult = {
          success: true,
          key: testKey,
          url: "https://example.com/file.txt",
        };
        mockProvider.upload.mockResolvedValue(expectedResult);

        const result = await service.uploadFile(
          testKey,
          testData,
          testContentType
        );

        expect(mockProvider.upload).toHaveBeenCalledWith({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });
        expect(result).toEqual(expectedResult);
      });

      it("should log failed upload results from the provider", async () => {
        mockProvider.upload.mockResolvedValue({
          success: false,
          key: testKey,
          error: "provider failed",
        });

        const result = await service.uploadFile(testKey, testData, testContentType);

        expect(result).toEqual({
          success: false,
          key: testKey,
          error: "provider failed",
        });
        expect(getLoggedEntries()).toContainEqual(
          expect.objectContaining({
            level: "error",
            scope: "storage",
            event: "storage.service.upload.failed",
            context: expect.objectContaining({
              operation: "upload",
              key: testKey,
            }),
          })
        );
      });
    });

    describe("downloadFile", () => {
      it("should call provider download method", async () => {
        const expectedResult = {
          success: true,
          data: testData,
          contentType: testContentType,
        };
        mockProvider.download.mockResolvedValue(expectedResult);

        const result = await service.downloadFile(testKey);

        expect(mockProvider.download).toHaveBeenCalledWith(testKey);
        expect(result).toEqual(expectedResult);
      });
    });

    describe("generateSignedUrl", () => {
      it("should call provider getSignedUrl method", async () => {
        mockProvider.getSignedUrl.mockResolvedValue("https://signed-url.com");

        const result = await service.generateSignedUrl(testKey, 7200);

        expect(mockProvider.getSignedUrl).toHaveBeenCalledWith(testKey, 7200);
        expect(result).toBe("https://signed-url.com");
      });

      it("should use default expiration time", async () => {
        mockProvider.getSignedUrl.mockResolvedValue("https://signed-url.com");

        await service.generateSignedUrl(testKey);

        expect(mockProvider.getSignedUrl).toHaveBeenCalledWith(testKey, 3600);
      });
    });

    describe("deleteFile", () => {
      it("should call provider delete method", async () => {
        mockProvider.delete.mockResolvedValue(undefined);

        await service.deleteFile(testKey);

        expect(mockProvider.delete).toHaveBeenCalledWith(testKey);
      });
    });

    describe("updateFile", () => {
      it("should call uploadFile method", async () => {
        const expectedResult = {
          success: true,
          key: testKey,
          url: "https://example.com/file.txt",
        };
        mockProvider.upload.mockResolvedValue(expectedResult);

        const result = await service.updateFile(
          testKey,
          testData,
          testContentType
        );

        expect(mockProvider.upload).toHaveBeenCalledWith({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });
        expect(result).toEqual(expectedResult);
      });
    });

    describe("listFiles", () => {
      it("should call provider list method", async () => {
        const expectedResult = {
          success: true,
          files: [],
          hasMore: false,
        };
        mockProvider.list.mockResolvedValue(expectedResult);

        const result = await service.listFiles("prefix/", 50);

        expect(mockProvider.list).toHaveBeenCalledWith("prefix/", 50);
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe("Configuration", () => {
    describe("createS3ProviderConfig", () => {
      const originalEnv = process.env;

      beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it("should create production config", () => {
        process.env.SYSTEM_AWS_S3_REGION = "us-east-1";
        process.env.SYSTEM_AWS_ACCESS_KEY_ID = "prod-key";
        process.env.SYSTEM_AWS_SECRET_ACCESS_KEY = "prod-secret";
        process.env.SYSTEM_AWS_S3_BUCKET = "prod-bucket";
        process.env.USE_LOCALSTACK = "false";
        delete process.env.LOCALSTACK_ENDPOINT;
        delete process.env.LOCALSTACK_PUBLIC_ENDPOINT;

        const config = createS3ProviderConfig();

        expect(config).toEqual({
          region: "us-east-1",
          accessKeyId: "prod-key",
          secretAccessKey: "prod-secret",
          bucket: "prod-bucket",
        });
      });

      it("should create development config with LocalStack", () => {
        process.env.SYSTEM_AWS_REGION = "us-east-1";
        process.env.SYSTEM_AWS_ACCESS_KEY_ID = "dev-key";
        process.env.SYSTEM_AWS_SECRET_ACCESS_KEY = "dev-secret";
        process.env.SYSTEM_AWS_S3_BUCKET = "dev-bucket";
        process.env.LOCALSTACK_ENDPOINT = "http://localhost:4566";
        process.env.LOCALSTACK_PUBLIC_ENDPOINT = "http://localhost:4566";
        process.env.USE_LOCALSTACK = "true";

        const config = createS3ProviderConfig();

        expect(config).toEqual({
          region: "us-east-1",
          accessKeyId: "dev-key",
          secretAccessKey: "dev-secret",
          bucket: "dev-bucket",
          endpoint: "http://localhost:4566",
          publicEndpoint: "http://localhost:4566",
          forcePathStyle: true,
        });
      });
    });

    describe("createStorageServiceInstance", () => {
      it("should create S3 storage service by default", () => {
        const service = createStorageServiceInstance();

        expect(service).toBeInstanceOf(StorageServiceImpl);
      });

      it("should throw for unknown storage providers", () => {
        process.env.STORAGE_PROVIDER = "s4";

        expect(() => createStorageServiceInstance()).toThrow(
          "Unknown STORAGE_PROVIDER: s4"
        );
      });
    });

    describe("createS3CompatibleProviderConfig", () => {
      const originalEnv = process.env;

      beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it("should create config for s3-compatible endpoints", () => {
        process.env.S3_COMPATIBLE_ENDPOINT = "https://storage.example.test";
        process.env.SYSTEM_AWS_S3_REGION = "auto";
        process.env.SYSTEM_AWS_ACCESS_KEY_ID = "compat-key";
        process.env.SYSTEM_AWS_SECRET_ACCESS_KEY = "compat-secret";
        process.env.SYSTEM_AWS_S3_BUCKET = "compat-bucket";
        process.env.S3_COMPATIBLE_FORCE_PATH_STYLE = "false";

        const storage = loadStorageModule();
        const config = storage.createS3CompatibleProviderConfig!();

        expect(config).toEqual({
          region: "auto",
          accessKeyId: "compat-key",
          secretAccessKey: "compat-secret",
          bucket: "compat-bucket",
          endpoint: "https://storage.example.test",
          publicEndpoint: "https://storage.example.test",
          forcePathStyle: false,
        });
      });

      it("should require an s3-compatible endpoint", () => {
        const storage = loadStorageModule();

        expect(() => storage.createS3CompatibleProviderConfig!()).toThrow(
          "Missing required environment variable: S3_COMPATIBLE_ENDPOINT"
        );
      });
    });

    describe("createGCSProviderConfig", () => {
      const originalEnv = process.env;

      beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it("should create GCS config and normalize private keys", () => {
        process.env.GCS_PROJECT_ID = "gcs-project";
        process.env.GCS_BUCKET = "gcs-bucket";
        process.env.GCS_CLIENT_EMAIL = "svc@example.test";
        process.env.GCS_PRIVATE_KEY = "line1\\nline2";
        process.env.GCS_REGION = "asia-southeast1";

        const storage = loadStorageModule();
        const config = storage.createGCSProviderConfig!();

        expect(config).toEqual({
          projectId: "gcs-project",
          bucket: "gcs-bucket",
          credentials: {
            clientEmail: "svc@example.test",
            privateKey: "line1\nline2",
          },
          region: "asia-southeast1",
        });
      });

      it("should export a GCS provider constructor", () => {
        const storage = loadStorageModule();

        expect(typeof storage.GCSProvider).toBe("function");
      });
    });
  });

  describe("GCSProvider", () => {
    const createProvider = () => {
      const storage = loadStorageModule();
      return new storage.GCSProvider!({
        projectId: "gcs-project",
        bucket: "gcs-bucket",
        credentials: {
          clientEmail: "service-account@example.test",
          privateKey: "private-key",
        },
        region: "asia-southeast1",
      });
    };

    it("should log upload failures", async () => {
      mockGcsSave.mockRejectedValue(new Error("GCS upload failed"));
      const provider = createProvider();

      const result = await provider.upload({
        key: testKey,
        data: testData,
        contentType: testContentType,
      });

      expect(result).toEqual({
        success: false,
        key: testKey,
        error: "GCS upload failed",
      });
      expect(getLoggedEntries()).toContainEqual(
        expect.objectContaining({
          level: "error",
          scope: "storage",
          event: "storage.gcs.upload.failed",
          context: expect.objectContaining({
            operation: "upload",
            provider: "gcs",
            bucket: "gcs-bucket",
            region: "asia-southeast1",
            key: testKey,
          }),
        })
      );
    });

    it("should log download failures", async () => {
      mockGcsDownload.mockRejectedValue(new Error("GCS download failed"));
      const provider = createProvider();

      const result = await provider.download(testKey);

      expect(result).toEqual({
        success: false,
        error: "GCS download failed",
      });
      expect(getLoggedEntries()).toContainEqual(
        expect.objectContaining({
          level: "error",
          scope: "storage",
          event: "storage.gcs.download.failed",
          context: expect.objectContaining({
            operation: "download",
            provider: "gcs",
            bucket: "gcs-bucket",
            region: "asia-southeast1",
            key: testKey,
          }),
        })
      );
    });

    it("should log signed URL failures", async () => {
      mockGcsGetSignedUrl.mockRejectedValue(new Error("GCS signed URL failed"));
      const provider = createProvider();

      await expect(provider.getSignedUrl(testKey, 3600)).rejects.toThrow(
        "GCS signed URL failed"
      );
      expect(getLoggedEntries()).toContainEqual(
        expect.objectContaining({
          level: "error",
          scope: "storage",
          event: "storage.gcs.signed_url.failed",
          context: expect.objectContaining({
            operation: "getSignedUrl",
            provider: "gcs",
            bucket: "gcs-bucket",
            region: "asia-southeast1",
            key: testKey,
          }),
        })
      );
    });

    it("should log delete failures", async () => {
      mockGcsDelete.mockRejectedValue(new Error("GCS delete failed"));
      const provider = createProvider();

      await expect(provider.delete(testKey)).rejects.toThrow("GCS delete failed");
      expect(getLoggedEntries()).toContainEqual(
        expect.objectContaining({
          level: "error",
          scope: "storage",
          event: "storage.gcs.delete.failed",
          context: expect.objectContaining({
            operation: "delete",
            provider: "gcs",
            bucket: "gcs-bucket",
            region: "asia-southeast1",
            key: testKey,
          }),
        })
      );
    });

    it("should log list failures", async () => {
      mockGcsGetFiles.mockRejectedValue(new Error("GCS list failed"));
      const provider = createProvider();

      const result = await provider.list("prefix/");

      expect(result).toEqual({
        success: false,
        files: [],
        hasMore: false,
        error: "GCS list failed",
      });
      expect(getLoggedEntries()).toContainEqual(
        expect.objectContaining({
          level: "error",
          scope: "storage",
          event: "storage.gcs.list.failed",
          context: expect.objectContaining({
            operation: "list",
            provider: "gcs",
            bucket: "gcs-bucket",
            region: "asia-southeast1",
            prefix: "prefix/",
          }),
        })
      );
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete upload→download→delete flow", async () => {
      const provider = new S3Provider({
        region: "us-east-1",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "test-bucket",
      });
      const service = new StorageServiceImpl(provider);

      // Mock successful operations
      const { S3Client } = jest.requireMock("@aws-sdk/client-s3") as {
        S3Client: jest.Mock;
      };
      const mockSend = jest.fn();
      S3Client.mockImplementation(() => ({ send: mockSend }));

      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new Uint8Array([116, 101, 115, 116]),
          })
          .mockResolvedValueOnce({ done: true }),
      };

      mockSend
        .mockResolvedValueOnce({ ETag: '"upload-etag"' }) // upload
        .mockResolvedValueOnce({
          Body: { getReader: () => mockReader },
          ContentType: "text/plain",
          ContentLength: 4,
        }) // download
        .mockResolvedValueOnce({}); // delete

      // Test the flow
      const uploadResult = await service.uploadFile(
        testKey,
        testData,
        testContentType
      );
      expect(uploadResult.success).toBe(true);

      const downloadResult = await service.downloadFile(testKey);
      expect(downloadResult.success).toBe(true);

      await expect(service.deleteFile(testKey)).resolves.not.toThrow();
    });
  });
});
