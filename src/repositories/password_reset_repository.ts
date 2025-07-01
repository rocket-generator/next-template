import {
  PasswordResetSchema,
  transformPrismToModel,
} from "@/models/password_reset";
import { PrismaRepository } from "./prisma_repository";
import { PasswordReset } from "@/models/password_reset";

export class PasswordResetRepository extends PrismaRepository<
  typeof PasswordResetSchema
> {
  public constructor() {
    super(PasswordResetSchema, "passwordReset", transformPrismToModel, [
      "token",
    ]);
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
