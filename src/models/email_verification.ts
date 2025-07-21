import { z } from "zod";
import { EmailVerification as PrismaModel } from "@/generated/prisma";

export const EmailVerificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmailVerification = z.infer<typeof EmailVerificationSchema>;

export function transformPrismToModel(data: unknown): EmailVerification {
  return EmailVerificationSchema.parse(data as PrismaModel);
}
