import { z } from "zod";
import { SignInRequest } from "@/requests/signin_request";
import { AccessToken, AccessTokenSchema } from "@/models/access_token";
import { SignUpRequest } from "@/requests/signup_request";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { Status, StatusSchema } from "@/models/status";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { AuthSchema } from "@/models/auth";
import { hashPassword, verifyPassword, generateToken } from "@/libraries/hash";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { AuthRepositoryInterface } from "@/repositories/auth_repository";
import { createEmailServiceInstance } from "@/libraries/email";
import {
  generateResetToken,
  createTokenExpiry,
  isTokenExpired,
} from "@/libraries/reset_token";
import { PasswordReset } from "@/models/password_reset";

export class AuthService {
  constructor(
    private authRepository: AuthRepositoryInterface,
    private passwordResetRepository: PasswordResetRepository
  ) {}

  async signIn(request: SignInRequest): Promise<AccessToken> {
    // Find user by email
    const users = await this.authRepository.get(
      0,
      1,
      undefined,
      undefined,
      undefined,
      [{ column: "email", operator: "=", value: request.email }]
    );

    if (users.data.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = users.data[0];

    // Verify password
    const isValidPassword = await verifyPassword(
      request.password,
      user.password
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate access token
    const accessToken = await generateToken();

    return AccessTokenSchema.parse({
      id: user.id,
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      permissions: user.permissions,
    });
  }

  async signUp(request: SignUpRequest): Promise<AccessToken> {
    // Check if user already exists
    const existingUsers = await this.authRepository.get(
      0,
      1,
      undefined,
      undefined,
      undefined,
      [{ column: "email", operator: "=", value: request.email }]
    );

    if (existingUsers.data.length > 0) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(request.password);

    // Create user
    const newUser = await this.authRepository.create({
      email: request.email,
      password: hashedPassword,
      name: request.name,
      permissions: [],
    });

    // Generate access token
    const accessToken = await generateToken();

    return AccessTokenSchema.parse({
      id: newUser.id,
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      permissions: newUser.permissions,
    });
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<Status> {
    try {
      // Find user by email
      const users = await this.authRepository.get(
        0,
        1,
        undefined,
        undefined,
        undefined,
        [{ column: "email", operator: "=", value: request.email }]
      );

      if (users.data.length === 0) {
        // Don't reveal whether email exists or not
        return StatusSchema.parse({
          success: true,
          message:
            "If an account with that email exists, a password reset link has been sent.",
          code: 200,
        });
      }

      const user = users.data[0];

      // Delete any existing tokens for this user
      await this.passwordResetRepository.deleteUserTokens(user.id);

      // Create new reset token
      const resetToken = await this.createResetToken(user.id);

      // Send email with reset link
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken.token}`;

      const emailService = createEmailServiceInstance();
      await emailService.sendPasswordResetEmail(user.email, resetUrl);

      return StatusSchema.parse({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        code: 200,
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);

      // Still return success to avoid revealing system errors
      return StatusSchema.parse({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        code: 200,
      });
    }
  }

  /**
   * パスワードリセット処理
   */
  async resetPassword(request: ResetPasswordRequest): Promise<Status> {
    try {
      // Find and validate the reset token
      const resetToken = await this.findValidResetToken(request.token);

      if (!resetToken) {
        throw new Error("Invalid or expired reset token");
      }

      // Find the user
      const user = await this.authRepository.findById(resetToken.userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Verify that the email matches (extra security check)
      if (user.email !== request.email) {
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const hashedPassword = await hashPassword(request.password);

      // Update user password
      await this.authRepository.update(user.id, {
        password: hashedPassword,
      });

      // Mark the token as used
      await this.passwordResetRepository.update(resetToken.id, {
        usedAt: new Date(),
      });

      // Delete all other tokens for this user
      await this.passwordResetRepository.deleteUserTokens(user.id);

      return StatusSchema.parse({
        success: true,
        message: "Password has been reset successfully.",
        code: 200,
      });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      throw new Error("Invalid reset token");
    }
  }

  /**
   * ユーザーパスワード更新
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.trim() === "") {
      // Don't update if password is empty
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.authRepository.update(userId, {
      password: hashedPassword,
    });
  }

  /**
   * ハッシュ化されたパスワードでユーザー作成
   */
  async createUserWithHashedPassword(
    userData: Omit<z.infer<typeof AuthSchema>, "id" | "password"> & {
      password: string;
    }
  ): Promise<z.infer<typeof AuthSchema>> {
    const hashedPassword = await hashPassword(userData.password);

    return this.authRepository.create({
      ...userData,
      password: hashedPassword,
    });
  }

  /**
   * ユーザーデータ更新（パスワードハッシュ化を含む）
   */
  async updateUserData(
    userId: string,
    userData: Partial<z.infer<typeof AuthSchema>>
  ): Promise<z.infer<typeof AuthSchema>> {
    const updateData = { ...userData };

    // If password is provided and not empty, hash it
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await hashPassword(updateData.password);
    } else {
      // Remove password from update data if it's empty
      delete updateData.password;
    }

    return this.authRepository.update(userId, updateData);
  }

  /**
   * リセットトークン作成
   */
  async createResetToken(userId: string): Promise<PasswordReset> {
    const token = await generateResetToken();
    const expiresAt = createTokenExpiry();
    const now = new Date();

    const resetData = {
      userId,
      token,
      expiresAt,
      usedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.passwordResetRepository.create(resetData);
  }

  /**
   * 有効なリセットトークンの検索
   */
  async findValidResetToken(token: string): Promise<PasswordReset | null> {
    try {
      const resetTokens = await this.passwordResetRepository.get(
        0,
        1,
        undefined,
        undefined,
        undefined,
        [
          { column: "token", operator: "=", value: token },
          { column: "usedAt", operator: "=", value: null },
        ]
      );

      if (resetTokens.data.length === 0) {
        return null;
      }

      const resetToken = resetTokens.data[0];

      if (isTokenExpired(resetToken.expiresAt)) {
        return null;
      }

      return resetToken;
    } catch (error) {
      console.error("Error finding valid token:", error);
      return null;
    }
  }

  /**
   * 期限切れトークンのクリーンアップ
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const expiredTokens = await this.passwordResetRepository.get(
        0,
        1000,
        undefined,
        undefined,
        undefined,
        [{ column: "expiresAt", operator: "<", value: now }]
      );

      for (const token of expiredTokens.data) {
        await this.passwordResetRepository.delete(token.id);
      }

      console.log(
        `Cleaned up ${expiredTokens.data.length} expired password reset tokens`
      );
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  /**
   * プロフィール情報を更新する（設定画面用）
   */
  async updateProfile(
    userId: string,
    name: string,
    email: string
  ): Promise<z.infer<typeof AuthSchema>> {
    return this.authRepository.update(userId, { name, email });
  }

  /**
   * パスワードを変更する（設定画面用）
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<z.infer<typeof AuthSchema>> {
    const user = await this.authRepository.findById(userId);

    // 現在のパスワードを検証
    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      throw new Error("invalid_current_password");
    }

    // 新しいパスワードをハッシュ化して更新
    const hashedNewPassword = await hashPassword(newPassword);

    return this.authRepository.update(userId, { password: hashedNewPassword });
  }
}
