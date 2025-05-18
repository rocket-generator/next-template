import { z } from "zod";
import { User as PrismaModel } from "@/generated/prisma";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  permissions: z.array(z.string()),
});

export type User = z.infer<typeof UserSchema>;

export function transformPrismToModel(data: PrismaModel): User {
  return UserSchema.parse({ ...data, title: "タイトル" });
}
