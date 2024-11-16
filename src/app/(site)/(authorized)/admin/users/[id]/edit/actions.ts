"use server";

import { UserRepository } from "@/repositories/user_repository";
import { auth } from "@/libraries/auth";
import { redirect } from "next/navigation";

export async function updateUser(id: string, data: any): Promise<boolean> {
  const session = await auth();
  const repository = new UserRepository(session?.access_token);

  try {
    const user = await repository.update(id, data);
    redirect(`/admin/users/${user.id}`);
    return true;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to delete user");
  }
  return false;
}
