import { createLogger, type LogContext } from "@/libraries/logger";

// Email Service Interface
export interface EmailService {
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>;
  sendVerificationEmail(to: string, verificationUrl: string): Promise<void>;
}

// Email Provider Interface (for future extensibility)
export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
}

// Email Options Interface
export interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

// Email Result Interface
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// SES Provider Configuration
export interface SESProviderConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For LocalStack
}

export interface SMTPProviderConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}

const emailLogger = createLogger("email");

function getEmailDomain(email: string): string | undefined {
  const [, domain] = email.split("@");
  return domain || undefined;
}

function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "[invalid-email]";
  }

  return `${localPart[0]}***@${domain}`;
}

function buildRecipientContext(email: string, extra?: LogContext): LogContext {
  const recipientDomain = getEmailDomain(email);

  return {
    toMasked: maskEmailAddress(email),
    ...(recipientDomain ? { recipientDomain } : {}),
    ...(extra ?? {}),
  };
}

// SES Provider Implementation
export class SESProvider implements EmailProvider {
  private config: SESProviderConfig;

  constructor(config: SESProviderConfig) {
    this.config = config;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Dynamic import for AWS SDK to ensure Edge Runtime compatibility
      const { SESClient, SendEmailCommand } = await import(
        "@aws-sdk/client-ses"
      );

      // Create SES client with configuration
      const clientConfig: {
        region: string;
        credentials: {
          accessKeyId: string;
          secretAccessKey: string;
        };
        endpoint?: string;
      } = {
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      };

      // Add endpoint for LocalStack if provided
      if (this.config.endpoint) {
        clientConfig.endpoint = this.config.endpoint;
      }

      const sesClient = new SESClient(clientConfig);

      // Prepare email parameters
      const params = {
        Source: options.from,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: "UTF-8",
          },
          Body: {
            ...(options.html && {
              Html: {
                Data: options.html,
                Charset: "UTF-8",
              },
            }),
            ...(options.text && {
              Text: {
                Data: options.text,
                Charset: "UTF-8",
              },
            }),
          },
        },
      };

      // Send email
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      emailLogger.error(
        "email.provider.ses.send.failed",
        "SES email sending failed",
        {
          context: buildRecipientContext(options.to, {
            provider: "ses",
          }),
          error,
        }
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export class SMTPProvider implements EmailProvider {
  private config: SMTPProviderConfig;

  constructor(config: SMTPProviderConfig) {
    this.config = config;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const nodemailer = await import("nodemailer");
      const transportConfig = {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth:
          this.config.user || this.config.pass
            ? {
                user: this.config.user,
                pass: this.config.pass,
              }
            : undefined,
      };

      const transporter = nodemailer.createTransport(transportConfig);
      const result = await transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Main Email Service Implementation
export class EmailServiceImpl implements EmailService {
  private provider: EmailProvider;
  private fromEmail: string;

  constructor(provider: EmailProvider, fromEmail: string) {
    this.provider = provider;
    this.fromEmail = fromEmail;
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const emailOptions: EmailOptions = {
      from: this.fromEmail,
      to,
      subject: "パスワードリセットのご案内",
      html: this.generatePasswordResetEmailHTML(resetUrl),
    };

    const result = await this.provider.sendEmail(emailOptions);

    if (!result.success) {
      emailLogger.error(
        "email.password_reset.failed",
        "Password reset email delivery failed",
        {
          context: buildRecipientContext(to),
          error: result.error,
        }
      );
      throw new Error("Failed to send password reset email");
    }

    emailLogger.info("email.password_reset.sent", "Password reset email sent", {
      context: buildRecipientContext(to, {
        ...(result.messageId ? { messageId: result.messageId } : {}),
      }),
    });
  }

  async sendVerificationEmail(
    to: string,
    verificationUrl: string
  ): Promise<void> {
    const emailOptions: EmailOptions = {
      from: this.fromEmail,
      to,
      subject: "メールアドレス認証のご案内",
      html: this.generateVerificationEmailHTML(verificationUrl),
    };

    const result = await this.provider.sendEmail(emailOptions);

    if (!result.success) {
      emailLogger.error(
        "email.verification.failed",
        "Verification email delivery failed",
        {
          context: buildRecipientContext(to),
          error: result.error,
        }
      );
      throw new Error("Failed to send verification email");
    }

    emailLogger.info("email.verification.sent", "Verification email sent", {
      context: buildRecipientContext(to, {
        ...(result.messageId ? { messageId: result.messageId } : {}),
      }),
    });
  }

  private generatePasswordResetEmailHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>パスワードリセット</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>パスワードリセットのご案内</h2>
          <p>パスワードリセットのリクエストを受け付けました。</p>
          <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              パスワードをリセット
            </a>
          </div>
          <p>このリンクは24時間有効です。</p>
          <p>もしこのメールに心当たりがない場合は、無視してください。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            このメールは自動送信されています。返信はできません。
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private generateVerificationEmailHTML(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>メールアドレス認証</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>メールアドレス認証のご案内</h2>
          <p>アカウント登録いただき、ありがとうございます。</p>
          <p>以下のリンクをクリックして、メールアドレスの認証を完了してください：</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              メールアドレスを認証
            </a>
          </div>
          <p>このリンクは24時間有効です。</p>
          <p>認証が完了すると、すべての機能をご利用いただけます。</p>
          <p>もしこのメールに心当たりがない場合は、無視してください。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            このメールは自動送信されています。返信はできません。
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

// Configuration Factory
export function createSESProviderConfig(): SESProviderConfig {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Production: Use AWS SES
    return {
      region: process.env.SYSTEM_AWS_SES_REGION || "us-east-1",
      accessKeyId: process.env.SYSTEM_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.SYSTEM_AWS_SECRET_ACCESS_KEY || "",
    };
  } else {
    // Development: Use LocalStack SES
    return {
      region: process.env.SYSTEM_AWS_SES_REGION || "us-east-1",
      accessKeyId: process.env.SYSTEM_AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.SYSTEM_AWS_SECRET_ACCESS_KEY || "test",
      endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
    };
  }
}

function parseSmtpPort(value: string | undefined): number {
  if (!value) {
    return 587;
  }

  const port = Number.parseInt(value, 10);
  if (Number.isNaN(port)) {
    throw new Error(`Invalid SMTP_PORT: ${value}`);
  }

  return port;
}

function parseBooleanEnv(name: string, defaultValue: boolean): boolean {
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

export function createSMTPProviderConfig(): SMTPProviderConfig {
  return {
    host: process.env.SMTP_HOST || "",
    port: parseSmtpPort(process.env.SMTP_PORT),
    secure: parseBooleanEnv("SMTP_SECURE", false),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

function resolveFromEmail(): string {
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM;
  }

  if (process.env.SES_FROM_EMAIL) {
    emailLogger.warn(
      "email.from.deprecated_env",
      "SES_FROM_EMAIL is deprecated. Use EMAIL_FROM instead."
    );
    return process.env.SES_FROM_EMAIL;
  }

  return process.env.NODE_ENV === "production"
    ? "noreply@example.com"
    : "noreply@localhost";
}

// Email Service Factory
export function createEmailServiceInstance(): EmailService {
  const providerName = process.env.EMAIL_PROVIDER ?? "ses";
  const fromEmail = resolveFromEmail();

  switch (providerName) {
    case "ses":
      return new EmailServiceImpl(
        new SESProvider(createSESProviderConfig()),
        fromEmail
      );
    case "smtp":
      return new EmailServiceImpl(
        new SMTPProvider(createSMTPProviderConfig()),
        fromEmail
      );
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: ${providerName}`);
  }
}
