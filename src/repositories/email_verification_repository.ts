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
    const { getPrismaModel } = await import("./prisma_repository");
    await getPrismaModel(this.modelName).deleteMany({
      where: { userId },
    });
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
