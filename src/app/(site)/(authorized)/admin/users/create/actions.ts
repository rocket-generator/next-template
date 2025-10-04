"use server";

import { UserRepository } from "@/repositories/user_repository";
import { UserCreateRequest } from "@/requests/admin/user_create_request";
import { hashPassword } from "@/libraries/hash";

export async function createUser(
  data: UserCreateRequest
): Promise<string | null> {
  "use server";
  const repository = new UserRepository();

  try {
    // パスワードが空でない場合のみハッシュ化
    const hashedPassword = data.password
      ? await hashPassword(data.password)
      : "";

    const user = await repository.create({
      ...data,
      password: hashedPassword,
      isActive: true,
      emailVerified: true,
    });
    return user.id;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user");
  }
  return null;
}
