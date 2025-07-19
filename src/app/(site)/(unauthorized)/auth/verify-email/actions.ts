"use server";

import { AuthService } from "@/services/auth_service";
import { UserRepository } from "@/repositories/user_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
import { Status } from "@/models/status";

/**
 * メールアドレス認証を実行
 */
export async function verifyEmailAction(token: string): Promise<Status> {
  try {
    const userRepository = new UserRepository();
    const passwordResetRepository = new PasswordResetRepository();
    const emailVerificationRepository = new EmailVerificationRepository();
    const authService = new AuthService(
      userRepository,
      passwordResetRepository,
      emailVerificationRepository
    );

    return await authService.verifyEmail(token);
  } catch (error) {
    console.error("Error in verifyEmailAction:", error);
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
    const userRepository = new UserRepository();
    const passwordResetRepository = new PasswordResetRepository();
    const emailVerificationRepository = new EmailVerificationRepository();
    const authService = new AuthService(
      userRepository,
      passwordResetRepository,
      emailVerificationRepository
    );

    return await authService.resendVerificationEmail(email);
  } catch (error) {
    console.error("Error in resendVerificationEmailAction:", error);
    return {
      success: false,
      message: "認証メールの再送信中にエラーが発生しました。",
      code: 500,
    };
  }
}
