import {
  StorageService,
  StorageProvider,
  S3Provider,
  StorageServiceImpl,
  createS3ProviderConfig,
  createStorageServiceInstance,
} from "@/libraries/storage";

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

describe("Storage Library", () => {
  const testKey = "test/file.txt";
  const testData = Buffer.from("test content");
  const testContentType = "text/plain";

  // Mock console.error to avoid noise during error case testing
  let originalConsoleError: typeof console.error;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe("S3Provider", () => {
    let provider: S3Provider;
    let mockS3Client: jest.Mocked<any>;
    let mockSend: jest.Mock;

    beforeEach(() => {
      const { S3Client } = require("@aws-sdk/client-s3");
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
        const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
        getSignedUrl.mockResolvedValue("https://signed-url.com");

        const result = await provider.getSignedUrl(testKey, 3600);

        expect(result).toBe("https://signed-url.com");
        expect(getSignedUrl).toHaveBeenCalledTimes(1);
      });

      it("should handle signed URL generation failure", async () => {
        const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
        getSignedUrl.mockRejectedValue(new Error("URL generation failed"));

        await expect(provider.getSignedUrl(testKey, 3600)).rejects.toThrow(
          "URL generation failed"
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
      const { S3Client } = require("@aws-sdk/client-s3");
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
