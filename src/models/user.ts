import { z } from "zod";
import { User as PrismaModel } from "@/generated/prisma";
import { AuthSchema } from "./auth";

export const UserSchema = AuthSchema;

export type User = z.infer<typeof UserSchema>;

export function transformPrismToModel(data: PrismaModel): User {
  return UserSchema.parse({ ...data, title: "タイトル" });
}
