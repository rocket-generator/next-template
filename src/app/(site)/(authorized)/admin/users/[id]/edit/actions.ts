"use server";

import { UserRepository } from "@/repositories/user_repository";
import { auth } from "@/libraries/auth";
import { UserUpdateRequest } from "@/requests/admin/user_update_request";

export async function updateUser(
  id: string,
  data: UserUpdateRequest
): Promise<boolean> {
  const session = await auth();
  const repository = new UserRepository(session?.access_token);

  try {
    await repository.update(id, data);
    return true;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to delete user");
  }
  return false;
}
