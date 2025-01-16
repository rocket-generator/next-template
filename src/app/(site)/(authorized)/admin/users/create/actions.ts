"use server";

import { UserRepository } from "@/repositories/admin/user_repository";
import { auth } from "@/libraries/auth";
import { UserCreateRequest } from "@/requests/admin/user_create_request";

export async function createUser(
  data: UserCreateRequest
): Promise<string | null> {
  "use server";
  const session = await auth();
  const repository = new UserRepository(session?.access_token);

  try {
    const user = await repository.create(data);
    return user.id;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user");
  }
  return null;
}
