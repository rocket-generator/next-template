import { z } from "zod";
import { User as PrismaModel } from "@/generated/prisma";
import { AuthSchema } from "./auth";

export const UserSchema = AuthSchema.extend({
  avatarKey: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export function transformPrismToModel(data: unknown): User {
  // PrismaモデルからUserモデルへの安全な変換
  const prismaData = data as PrismaModel;

  // AuthSchemaの必須フィールドとavatarKeyを含む変換データを作成
  const transformedData = {
    id: prismaData.id,
    email: prismaData.email,
    password: prismaData.password,
    name: prismaData.name,
    permissions: Array.isArray(prismaData.permissions)
      ? (prismaData.permissions as string[])
      : [],
    avatarKey: prismaData.avatarKey || undefined,
  };

  return UserSchema.parse(transformedData);
}
