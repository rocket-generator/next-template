"use server";

import { UserRepository } from "@/repositories/user_repository";

export async function deleteUser(userId: string) {
  const repository = new UserRepository();

  try {
    await repository.delete(userId);
    return true;
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("Failed to delete user");
  }
}
