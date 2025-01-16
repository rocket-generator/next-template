"use server";

import { UserRepository } from "@/repositories/admin/user_repository";
import { auth } from "@/libraries/auth";

export async function deleteUser(userId: string) {
  const session = await auth();
  const repository = new UserRepository(session?.access_token);

  try {
    await repository.delete(userId);
    return true;
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("Failed to delete user");
  }
}
