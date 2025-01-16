"use server";

import { UserRepository } from "@/repositories/admin/user_repository";
import { auth } from "@/libraries/auth";

export async function updateUser(id: string, data: any): Promise<boolean> {
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
