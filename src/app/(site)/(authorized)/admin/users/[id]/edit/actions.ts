"use server";

import { UserRepository } from "@/repositories/user_repository";
import { UserUpdateRequest } from "@/requests/admin/user_update_request";

export async function updateUser(
  id: string,
  data: UserUpdateRequest
): Promise<boolean> {
  const repository = new UserRepository();

  try {
    await repository.update(id, data);
    return true;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to delete user");
  }
  return false;
}
