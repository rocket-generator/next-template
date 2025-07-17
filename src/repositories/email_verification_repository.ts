import {
  EmailVerificationSchema,
  transformPrismToModel,
} from "@/models/email_verification";
import { PrismaRepository } from "./prisma_repository";
import { EmailVerification } from "@/models/email_verification";

export class EmailVerificationRepository extends PrismaRepository<
  typeof EmailVerificationSchema
> {
  public constructor() {
    super(EmailVerificationSchema, "emailVerification", transformPrismToModel, [
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

  async findByToken(token: string): Promise<EmailVerification | null> {
    try {
      const verificationTokens = await this.get(
        0,
        1,
        undefined,
        undefined,
        undefined,
        [{ column: "token", operator: "=", value: token }]
      );

      return verificationTokens.data.length > 0
        ? verificationTokens.data[0]
        : null;
    } catch (error) {
      console.error("Error finding token:", error);
      return null;
    }
  }
}
