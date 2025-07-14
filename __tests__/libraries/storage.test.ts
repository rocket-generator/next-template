import {
  StorageService,
  StorageProvider,
  S3Provider,
  LocalStorageProvider,
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

// Mock fs module for LocalStorageProvider
jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
  },
}));

jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  dirname: jest.fn((path) => path.split("/").slice(0, -1).join("/")),
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
        const errorMessage = "Upload failed";
        mockSend.mockRejectedValue(new Error(errorMessage));

        const result = await provider.upload({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe(errorMessage);
      });

      it("should include metadata when provided", async () => {
        mockSend.mockResolvedValue({});
        const metadata = { author: "test-user" };

        await provider.upload({
          key: testKey,
          data: testData,
          metadata,
        });

        const { PutObjectCommand } = require("@aws-sdk/client-s3");
        expect(PutObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            Metadata: metadata,
          })
        );
      });
    });

    describe("download", () => {
      it("should download file successfully", async () => {
        const mockReader = {
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: new Uint8Array([116, 101, 115, 116]) })
            .mockResolvedValueOnce({ done: true }),
        };

        mockSend.mockResolvedValue({
          Body: { getReader: () => mockReader },
          ContentType: testContentType,
          ContentLength: 4,
          LastModified: new Date(),
        });

        const result = await provider.download(testKey);

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Buffer);
        expect(result.contentType).toBe(testContentType);
        expect(result.contentLength).toBe(4);
      });

      it("should handle download failure", async () => {
        const errorMessage = "Download failed";
        mockSend.mockRejectedValue(new Error(errorMessage));

        const result = await provider.download(testKey);

        expect(result.success).toBe(false);
        expect(result.error).toBe(errorMessage);
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
        const expectedUrl = "https://test-bucket.s3.amazonaws.com/test/file.txt?signature=test";
        const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
        getSignedUrl.mockResolvedValue(expectedUrl);

        const result = await provider.getSignedUrl(testKey, 3600);

        expect(result).toBe(expectedUrl);
        expect(getSignedUrl).toHaveBeenCalledTimes(1);
      });

      it("should handle signed URL generation failure", async () => {
        const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
        getSignedUrl.mockRejectedValue(new Error("URL generation failed"));

        await expect(provider.getSignedUrl(testKey)).rejects.toThrow(
          "Failed to generate signed URL"
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

        await expect(provider.delete(testKey)).rejects.toThrow("Failed to delete file");
      });
    });

    describe("list", () => {
      it("should list files successfully", async () => {
        const mockContents = [
          {
            Key: "test/file1.txt",
            Size: 100,
            LastModified: new Date(),
            ETag: '"etag1"',
          },
          {
            Key: "test/file2.txt",
            Size: 200,
            LastModified: new Date(),
            ETag: '"etag2"',
          },
        ];

        mockSend.mockResolvedValue({
          Contents: mockContents,
          IsTruncated: false,
        });

        const result = await provider.list("test/", 10);

        expect(result.success).toBe(true);
        expect(result.files).toHaveLength(2);
        expect(result.files[0].key).toBe("test/file1.txt");
        expect(result.files[0].size).toBe(100);
        expect(result.hasMore).toBe(false);
      });

      it("should handle list failure", async () => {
        mockSend.mockRejectedValue(new Error("List failed"));

        const result = await provider.list();

        expect(result.success).toBe(false);
        expect(result.files).toHaveLength(0);
        expect(result.error).toBe("List failed");
      });

      it("should handle empty list", async () => {
        mockSend.mockResolvedValue({
          Contents: [],
          IsTruncated: false,
        });

        const result = await provider.list();

        expect(result.success).toBe(true);
        expect(result.files).toHaveLength(0);
        expect(result.hasMore).toBe(false);
      });
    });
  });

  describe("LocalStorageProvider", () => {
    let provider: LocalStorageProvider;
    let mockFs: jest.Mocked<any>;

    beforeEach(() => {
      mockFs = require("fs").promises;
      provider = new LocalStorageProvider("./test-uploads");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("upload", () => {
      it("should upload file successfully", async () => {
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        const result = await provider.upload({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });

        expect(result.success).toBe(true);
        expect(result.key).toBe(testKey);
        expect(result.url).toContain(testKey);
        expect(mockFs.mkdir).toHaveBeenCalled();
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining(testKey),
          testData
        );
      });

      it("should handle upload failure", async () => {
        mockFs.mkdir.mockRejectedValue(new Error("Directory creation failed"));

        const result = await provider.upload({
          key: testKey,
          data: testData,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Directory creation failed");
      });
    });

    describe("download", () => {
      it("should download file successfully", async () => {
        const stats = {
          size: testData.length,
          mtime: new Date(),
        };

        mockFs.readFile.mockResolvedValue(testData);
        mockFs.stat.mockResolvedValue(stats);

        const result = await provider.download(testKey);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(testData);
        expect(result.contentLength).toBe(testData.length);
        expect(result.lastModified).toEqual(stats.mtime);
      });

      it("should handle download failure", async () => {
        mockFs.readFile.mockRejectedValue(new Error("File not found"));

        const result = await provider.download(testKey);

        expect(result.success).toBe(false);
        expect(result.error).toBe("File not found");
      });
    });

    describe("getSignedUrl", () => {
      it("should generate local URL", async () => {
        const url = await provider.getSignedUrl(testKey, 3600);

        expect(url).toContain(testKey);
        expect(url).toContain("file://");
        expect(url).toContain("expires=");
      });
    });

    describe("delete", () => {
      it("should delete file successfully", async () => {
        mockFs.unlink.mockResolvedValue(undefined);

        await expect(provider.delete(testKey)).resolves.not.toThrow();
        expect(mockFs.unlink).toHaveBeenCalledWith(
          expect.stringContaining(testKey)
        );
      });

      it("should handle delete failure", async () => {
        mockFs.unlink.mockRejectedValue(new Error("Delete failed"));

        await expect(provider.delete(testKey)).rejects.toThrow("Failed to delete file");
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

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("uploadFile", () => {
      it("should call provider upload method", async () => {
        const expectedResult = { success: true, key: testKey };
        mockProvider.upload.mockResolvedValue(expectedResult);

        const result = await service.uploadFile(testKey, testData, testContentType);

        expect(result).toEqual(expectedResult);
        expect(mockProvider.upload).toHaveBeenCalledWith({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });
      });
    });

    describe("downloadFile", () => {
      it("should call provider download method", async () => {
        const expectedResult = { success: true, data: testData };
        mockProvider.download.mockResolvedValue(expectedResult);

        const result = await service.downloadFile(testKey);

        expect(result).toEqual(expectedResult);
        expect(mockProvider.download).toHaveBeenCalledWith(testKey);
      });
    });

    describe("generateSignedUrl", () => {
      it("should call provider getSignedUrl method", async () => {
        const expectedUrl = "https://example.com/signed-url";
        mockProvider.getSignedUrl.mockResolvedValue(expectedUrl);

        const result = await service.generateSignedUrl(testKey, 7200);

        expect(result).toBe(expectedUrl);
        expect(mockProvider.getSignedUrl).toHaveBeenCalledWith(testKey, 7200);
      });

      it("should use default expiration time", async () => {
        const expectedUrl = "https://example.com/signed-url";
        mockProvider.getSignedUrl.mockResolvedValue(expectedUrl);

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
        const expectedResult = { success: true, key: testKey };
        mockProvider.upload.mockResolvedValue(expectedResult);

        const result = await service.updateFile(testKey, testData, testContentType);

        expect(result).toEqual(expectedResult);
        expect(mockProvider.upload).toHaveBeenCalledWith({
          key: testKey,
          data: testData,
          contentType: testContentType,
        });
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

        const result = await service.listFiles("prefix/", 100);

        expect(result).toEqual(expectedResult);
        expect(mockProvider.list).toHaveBeenCalledWith("prefix/", 100);
      });
    });
  });

  describe("Configuration", () => {
    describe("createS3ProviderConfig", () => {
      const originalEnv = process.env;

      beforeEach(() => {
        process.env = { ...originalEnv };
      });

      afterEach(() => {
        process.env = originalEnv;
      });

      it("should create production config", () => {
        process.env.NODE_ENV = "production";
        process.env.AWS_S3_REGION = "eu-west-1";
        process.env.AWS_ACCESS_KEY_ID = "prod-key";
        process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";
        process.env.AWS_S3_BUCKET = "prod-bucket";

        const config = createS3ProviderConfig();

        expect(config.region).toBe("eu-west-1");
        expect(config.accessKeyId).toBe("prod-key");
        expect(config.secretAccessKey).toBe("prod-secret");
        expect(config.bucket).toBe("prod-bucket");
        expect(config.endpoint).toBeUndefined();
      });

      it("should create development config with LocalStack", () => {
        process.env.NODE_ENV = "development";
        process.env.LOCALSTACK_ENDPOINT = "http://localhost:4567";

        const config = createS3ProviderConfig();

        expect(config.region).toBe("us-east-1");
        expect(config.accessKeyId).toBe("test");
        expect(config.secretAccessKey).toBe("test");
        expect(config.bucket).toBe("test-bucket");
        expect(config.endpoint).toBe("http://localhost:4567");
        expect(config.forcePathStyle).toBe(true);
      });
    });

    describe("createStorageServiceInstance", () => {
      const originalEnv = process.env;

      beforeEach(() => {
        process.env = { ...originalEnv };
      });

      afterEach(() => {
        process.env = originalEnv;
      });

      it("should create S3 storage service by default", () => {
        const service = createStorageServiceInstance();

        expect(service).toBeInstanceOf(StorageServiceImpl);
      });

      it("should create local storage service when specified", () => {
        process.env.STORAGE_PROVIDER = "local";
        process.env.LOCAL_STORAGE_PATH = "./custom-uploads";

        const service = createStorageServiceInstance();

        expect(service).toBeInstanceOf(StorageServiceImpl);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete upload→download→delete flow", async () => {
      const mockProvider: jest.Mocked<StorageProvider> = {
        upload: jest.fn(),
        download: jest.fn(),
        getSignedUrl: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
      };

      const service = new StorageServiceImpl(mockProvider);

      // Mock successful responses
      mockProvider.upload.mockResolvedValue({
        success: true,
        key: testKey,
        url: "https://example.com/file.txt",
      });

      mockProvider.download.mockResolvedValue({
        success: true,
        data: testData,
        contentType: testContentType,
      });

      mockProvider.delete.mockResolvedValue(undefined);

      // Test upload
      const uploadResult = await service.uploadFile(testKey, testData, testContentType);
      expect(uploadResult.success).toBe(true);

      // Test download
      const downloadResult = await service.downloadFile(testKey);
      expect(downloadResult.success).toBe(true);
      expect(downloadResult.data).toEqual(testData);

      // Test delete
      await expect(service.deleteFile(testKey)).resolves.not.toThrow();

      // Verify all methods were called
      expect(mockProvider.upload).toHaveBeenCalledTimes(1);
      expect(mockProvider.download).toHaveBeenCalledTimes(1);
      expect(mockProvider.delete).toHaveBeenCalledTimes(1);
    });
  });
}); 