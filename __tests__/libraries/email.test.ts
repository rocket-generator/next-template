import {
  EmailServiceImpl,
  createSESProviderConfig,
  type EmailProvider,
} from "@/libraries/email";

describe("email library", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV =
      originalNodeEnv;
    delete process.env.AWS_SES_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.LOCALSTACK_ENDPOINT;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("createSESProviderConfig", () => {
    it("production では AWS SES の設定を返す", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV =
        "production";
      process.env.AWS_SES_REGION = "ap-southeast-1";
      process.env.AWS_ACCESS_KEY_ID = "aws-access-key";
      process.env.AWS_SECRET_ACCESS_KEY = "aws-secret-key";

      const config = createSESProviderConfig();

      expect(config).toEqual({
        region: "ap-southeast-1",
        accessKeyId: "aws-access-key",
        secretAccessKey: "aws-secret-key",
      });
    });

    it("development では LocalStack 用 endpoint と test credential を返す", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV =
        "development";
      process.env.AWS_SES_REGION = "us-west-2";
      process.env.LOCALSTACK_ENDPOINT = "http://localstack:4566";

      const config = createSESProviderConfig();

      expect(config).toEqual({
        region: "us-west-2",
        accessKeyId: "test",
        secretAccessKey: "test",
        endpoint: "http://localstack:4566",
      });
    });
  });

  describe("EmailServiceImpl", () => {
    let provider: jest.Mocked<EmailProvider>;

    beforeEach(() => {
      provider = {
        sendEmail: jest.fn(),
      };
    });

    it("sendPasswordResetEmail が件名・宛先・URL を含む本文を組み立てる", async () => {
      provider.sendEmail.mockResolvedValue({
        success: true,
        messageId: "message-1",
      });

      const service = new EmailServiceImpl(provider, "noreply@example.com");
      await service.sendPasswordResetEmail(
        "user@example.com",
        "http://localhost:3000/reset-password?token=abc"
      );

      expect(provider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@example.com",
          to: "user@example.com",
          subject: "パスワードリセットのご案内",
          html: expect.stringContaining(
            "http://localhost:3000/reset-password?token=abc"
          ),
        })
      );
    });

    it("sendVerificationEmail が件名・宛先・URL を含む本文を組み立てる", async () => {
      provider.sendEmail.mockResolvedValue({
        success: true,
        messageId: "message-2",
      });

      const service = new EmailServiceImpl(provider, "noreply@example.com");
      await service.sendVerificationEmail(
        "user@example.com",
        "http://localhost:3000/verify-email?token=abc"
      );

      expect(provider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@example.com",
          to: "user@example.com",
          subject: "メールアドレス認証のご案内",
          html: expect.stringContaining(
            "http://localhost:3000/verify-email?token=abc"
          ),
        })
      );
    });

    it("provider failure を例外化する", async () => {
      provider.sendEmail.mockResolvedValue({
        success: false,
        error: "provider error",
      });

      const service = new EmailServiceImpl(provider, "noreply@example.com");

      await expect(
        service.sendVerificationEmail(
          "user@example.com",
          "http://localhost:3000/verify-email?token=abc"
        )
      ).rejects.toThrow("Failed to send verification email");
    });
  });
});
