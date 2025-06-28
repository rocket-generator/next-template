import { AuthSchema } from "@/models/auth";
import { z } from "zod";
import { SignInRequest } from "@/requests/signin_request";
import { AccessToken, AccessTokenSchema } from "@/models/access_token";
import { SignUpRequest } from "@/requests/signup_request";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { Status, StatusSchema } from "@/models/status";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { PrismaRepository } from "./prisma_repository";
import { hashPassword, verifyPassword, generateToken } from "@/libraries/hash";
import { auth } from "@/libraries/auth";
import { PasswordResetRepository } from "./password_reset_repository";
import { createEmailServiceInstance } from "@/libraries/email";

export abstract class AuthRepository extends PrismaRepository<
  typeof AuthSchema
> {
  constructor(
    schema: typeof AuthSchema,
    modelName: string,
    converter: (data: unknown) => z.infer<typeof AuthSchema>,
    searchableColumns: string[]
  ) {
    super(schema, modelName, converter, searchableColumns);
  }

  async getMe(): Promise<z.infer<typeof AuthSchema>> {
    const session = await auth();
    if (!session || !session?.user?.id) {
      throw new Error("Unauthorized");
    }
    return this.findById(session.user.id);
  }

  async postSignIn(request: SignInRequest): Promise<AccessToken> {
    // Find user by email
    const users = await this.get(0, 1, undefined, undefined, undefined, [
      { column: "email", operator: "=", value: request.email },
    ]);

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

  async postSignUp(request: SignUpRequest): Promise<AccessToken> {
    // Check if user already exists
    const existingUsers = await this.get(
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
    const newUser = await this.create({
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

  async postForgotPassword(request: ForgotPasswordRequest): Promise<Status> {
    try {
      // Find user by email
      const users = await this.get(0, 1, undefined, undefined, undefined, [
        { column: "email", operator: "=", value: request.email },
      ]);

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
      const passwordResetRepo = new PasswordResetRepository();

      // Delete any existing tokens for this user
      await passwordResetRepo.deleteUserTokens(user.id);

      // Create new reset token
      const resetToken = await passwordResetRepo.createResetToken(user.id);

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
      console.error("Error in postForgotPassword:", error);

      // Still return success to avoid revealing system errors
      return StatusSchema.parse({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        code: 200,
      });
    }
  }

  async postResetPassword(request: ResetPasswordRequest): Promise<Status> {
    try {
      const passwordResetRepo = new PasswordResetRepository();

      // Find and validate the reset token
      const resetToken = await passwordResetRepo.findValidToken(request.token);

      if (!resetToken) {
        throw new Error("Invalid or expired reset token");
      }

      // Find the user
      const user = await this.findById(resetToken.userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Verify that the email matches (extra security check)
      if (user.email !== request.email) {
        throw new Error("Email does not match the reset token");
      }

      // Hash new password
      const hashedPassword = await hashPassword(request.password);

      // Update user password
      await this.update(user.id, {
        password: hashedPassword,
      });

      // Mark the token as used
      await passwordResetRepo.markTokenAsUsed(resetToken.id);

      // Delete all other tokens for this user
      await passwordResetRepo.deleteUserTokens(user.id);

      return StatusSchema.parse({
        success: true,
        message: "Password has been reset successfully.",
        code: 200,
      });
    } catch (error) {
      console.error("Error in postResetPassword:", error);
      throw new Error("Invalid reset token");
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.trim() === "") {
      // Don't update if password is empty
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.update(userId, {
      password: hashedPassword,
    });
  }

  async createUserWithHashedPassword(
    userData: Omit<z.infer<typeof AuthSchema>, "id" | "password"> & {
      password: string;
    }
  ): Promise<z.infer<typeof AuthSchema>> {
    const hashedPassword = await hashPassword(userData.password);

    return this.create({
      ...userData,
      password: hashedPassword,
    });
  }

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

    return this.update(userId, updateData);
  }
}
