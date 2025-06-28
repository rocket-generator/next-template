import { z } from "zod";
import { PasswordReset as PrismaModel } from "@/generated/prisma";

export const PasswordResetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  usedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PasswordReset = z.infer<typeof PasswordResetSchema>;

export function transformPrismToModel(data: unknown): PasswordReset {
  return PasswordResetSchema.parse(data as PrismaModel);
}