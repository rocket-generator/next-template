"use server";

import { createLogger } from "@/libraries/logger";
import { AuthService } from "@/services/auth_service";
import { Status } from "@/models/status";

const verifyEmailActionsLogger = createLogger("verify_email_actions");

/**
 * メールアドレス認証を実行
 */
export async function verifyEmailAction(token: string): Promise<Status> {
  try {
    const authService = new AuthService();

    return await authService.verifyEmail(token);
  } catch (error) {
    verifyEmailActionsLogger.error(
      "verify_email_actions.verify_email.failed",
      "Failed to verify email",
      {
        context: {
          action: "verify_email",
        },
        error,
      }
    );
    return {
      success: false,
      message: "認証処理中にエラーが発生しました。",
      code: 500,
    };
  }
}

/**
 * 認証メールを再送信
 */
export async function resendVerificationEmailAction(
  email: string
): Promise<Status> {
  try {
    const authService = new AuthService();

    return await authService.resendVerificationEmail(email);
  } catch (error) {
    verifyEmailActionsLogger.error(
      "verify_email_actions.resend_verification_email.failed",
      "Failed to resend verification email",
      {
        context: {
          action: "resend_verification_email",
        },
        error,
      }
    );
    return {
      success: false,
      message: "認証メールの再送信中にエラーが発生しました。",
      code: 500,
    };
  }
}
