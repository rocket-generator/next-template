import {
  EmailServiceImpl,
  createSESProviderConfig,
  type EmailProvider,
} from "@/libraries/email";

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail,
}));

jest.mock(
  "nodemailer",
  () => ({
    __esModule: true,
    createTransport: mockCreateTransport,
    default: {
      createTransport: mockCreateTransport,
    },
  }),
  { virtual: true }
);

type EmailModule = typeof import("@/libraries/email") & {
  createSMTPProviderConfig?: () => unknown;
  createEmailServiceInstance?: () => import("@/libraries/email").EmailService;
};

const loadEmailModule = () => require("@/libraries/email") as EmailModule;

describe("email library", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockCreateTransport.mockClear();
    mockSendMail.mockReset();
    mockSendMail.mockResolvedValue({ messageId: "smtp-message-id" });
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV =
      originalNodeEnv;
    delete process.env.SYSTEM_AWS_SES_REGION;
    delete process.env.SYSTEM_AWS_ACCESS_KEY_ID;
    delete process.env.SYSTEM_AWS_SECRET_ACCESS_KEY;
    delete process.env.LOCALSTACK_ENDPOINT;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.EMAIL_FROM;
    delete process.env.SES_FROM_EMAIL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe("createSESProviderConfig", () => {
    it("production では AWS SES の設定を返す", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV =
        "production";
      process.env.SYSTEM_AWS_SES_REGION = "ap-southeast-1";
      process.env.SYSTEM_AWS_ACCESS_KEY_ID = "aws-access-key";
      process.env.SYSTEM_AWS_SECRET_ACCESS_KEY = "aws-secret-key";

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
      process.env.SYSTEM_AWS_SES_REGION = "us-west-2";
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

  describe("provider factories", () => {
    it("SMTP 設定を生成する", () => {
      process.env.SMTP_HOST = "smtp.example.test";
      process.env.SMTP_PORT = "2525";
      process.env.SMTP_SECURE = "true";
      process.env.SMTP_USER = "smtp-user";
      process.env.SMTP_PASS = "smtp-pass";

      const emailModule = loadEmailModule();
      const config = emailModule.createSMTPProviderConfig!();

      expect(config).toEqual({
        host: "smtp.example.test",
        port: 2525,
        secure: true,
        user: "smtp-user",
        pass: "smtp-pass",
      });
    });

    it("未定義のメールプロバイダーは例外にする", () => {
      process.env.EMAIL_PROVIDER = "mail-pigeon";

      const emailModule = loadEmailModule();

      expect(() => emailModule.createEmailServiceInstance!()).toThrow(
        "Unknown EMAIL_PROVIDER: mail-pigeon"
      );
    });

    it("SMTP と EMAIL_FROM を使ってメール送信する", async () => {
      process.env.EMAIL_PROVIDER = "smtp";
      process.env.EMAIL_FROM = "noreply@example.test";
      process.env.SMTP_HOST = "smtp.example.test";
      process.env.SMTP_PORT = "2525";
      process.env.SMTP_SECURE = "false";
      process.env.SMTP_USER = "smtp-user";
      process.env.SMTP_PASS = "smtp-pass";

      const emailModule = loadEmailModule();
      const service = emailModule.createEmailServiceInstance!();

      await service.sendPasswordResetEmail(
        "user@example.test",
        "https://example.test/reset?token=abc"
      );

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: "smtp.example.test",
        port: 2525,
        secure: false,
        auth: {
          user: "smtp-user",
          pass: "smtp-pass",
        },
      });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@example.test",
          to: "user@example.test",
          subject: "パスワードリセットのご案内",
        })
      );
    });

    it("EMAIL_FROM が無い場合は SES_FROM_EMAIL にフォールバックし警告する", async () => {
      process.env.EMAIL_PROVIDER = "smtp";
      process.env.SES_FROM_EMAIL = "legacy@example.test";
      process.env.SMTP_HOST = "smtp.example.test";

      const emailModule = loadEmailModule();
      const service = emailModule.createEmailServiceInstance!();

      await service.sendVerificationEmail(
        "user@example.test",
        "https://example.test/verify?token=abc"
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("SES_FROM_EMAIL is deprecated")
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "legacy@example.test",
          to: "user@example.test",
          subject: "メールアドレス認証のご案内",
        })
      );
    });

    it("送信元アドレス未設定時は環境依存デフォルトを使う", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV =
        "development";
      process.env.EMAIL_PROVIDER = "smtp";
      process.env.SMTP_HOST = "smtp.example.test";

      const emailModule = loadEmailModule();
      const service = emailModule.createEmailServiceInstance!();

      await service.sendPasswordResetEmail(
        "user@example.test",
        "https://example.test/reset?token=abc"
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@localhost",
        })
      );
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
