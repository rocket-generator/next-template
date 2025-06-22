import { z } from "zod";
import { User as PrismaModel } from "@/generated/prisma";
import { AuthSchema } from "./auth";

export const UserSchema = AuthSchema;

export type User = z.infer<typeof UserSchema>;

export function transformPrismToModel(data: unknown): User {
  return UserSchema.parse({ ...(data as PrismaModel), title: "タイトル" });
}
