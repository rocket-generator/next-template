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
      console.error("SES email sending failed:", error);
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
      console.error("Failed to send password reset email:", result.error);
      throw new Error("Failed to send password reset email");
    }

    console.log(
      `Password reset email sent to ${to}, messageId: ${result.messageId}`
    );
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
      console.error("Failed to send verification email:", result.error);
      throw new Error("Failed to send verification email");
    }

    console.log(
      `Verification email sent to ${to}, messageId: ${result.messageId}`
    );
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
      region: process.env.AWS_SES_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    };
  } else {
    // Development: Use LocalStack SES
    return {
      region: process.env.AWS_SES_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
      endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
    };
  }
}

// Email Service Factory
export function createEmailServiceInstance(): EmailService {
  const sesConfig = createSESProviderConfig();
  const sesProvider = new SESProvider(sesConfig);
  const fromEmail =
    process.env.SES_FROM_EMAIL ||
    (process.env.NODE_ENV === "production"
      ? "noreply@example.com"
      : "noreply@localhost");

  return new EmailServiceImpl(sesProvider, fromEmail);
}
