"use server";

import { UserRepository } from "@/repositories/user_repository";
import { auth } from "@/libraries/auth";
import { redirect } from "next/navigation";

export async function deleteUser(userId: string) {
  const session = await auth();
  const repository = new UserRepository(session?.access_token);

  try {
    await repository.delete(userId);
    redirect("/admin/users");
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("Failed to delete user");
  }
}
