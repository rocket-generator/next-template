import {
  PasswordResetSchema,
  transformPrismToModel,
} from "@/models/password_reset";
import { PrismaRepository } from "./prisma_repository";
import { PasswordReset } from "@/models/password_reset";
import {
  generateResetToken,
  createTokenExpiry,
  isTokenExpired,
} from "@/libraries/reset_token";

export class PasswordResetRepository extends PrismaRepository<
  typeof PasswordResetSchema
> {
  public constructor() {
    super(PasswordResetSchema, "passwordReset", transformPrismToModel, [
      "token",
    ]);
  }

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

    return this.create(resetData);
  }

  async findValidToken(token: string): Promise<PasswordReset | null> {
    try {
      const resetTokens = await this.get(
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

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await this.update(tokenId, {
      usedAt: new Date(),
    });
  }

  async deleteUserTokens(userId: string): Promise<void> {
    try {
      const userTokens = await this.get(
        0,
        100,
        undefined,
        undefined,
        undefined,
        [{ column: "userId", operator: "=", value: userId }]
      );

      for (const token of userTokens.data) {
        await this.delete(token.id);
      }
    } catch (error) {
      console.error("Error deleting user tokens:", error);
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const expiredTokens = await this.get(
        0,
        1000,
        undefined,
        undefined,
        undefined,
        [{ column: "expiresAt", operator: "<", value: now }]
      );

      for (const token of expiredTokens.data) {
        await this.delete(token.id);
      }

      console.log(
        `Cleaned up ${expiredTokens.data.length} expired password reset tokens`
      );
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    try {
      const resetTokens = await this.get(
        0,
        1,
        undefined,
        undefined,
        undefined,
        [{ column: "token", operator: "=", value: token }]
      );

      return resetTokens.data.length > 0 ? resetTokens.data[0] : null;
    } catch (error) {
      console.error("Error finding token:", error);
      return null;
    }
  }
}
