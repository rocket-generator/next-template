"use server";

import { UserRepository } from "@/repositories/user_repository";
import { UserCreateRequest } from "@/requests/admin/user_create_request";

export async function createUser(
  data: UserCreateRequest
): Promise<string | null> {
  "use server";
  const repository = new UserRepository();

  try {
    const user = await repository.create({
      ...data,
      isActive: true,
      emailVerified: false,
    });
    return user.id;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user");
  }
  return null;
}
