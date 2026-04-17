"use server";

import { createLogger } from "@/libraries/logger";
import { UserRepository } from "@/repositories/user_repository";

const adminUserActionsLogger = createLogger("admin_user_actions");

export async function deleteUser(userId: string) {
  const repository = new UserRepository();

  try {
    await repository.delete(userId);
    return true;
  } catch (error) {
    adminUserActionsLogger.error(
      "admin_user_actions.delete_user.failed",
      "Failed to delete user",
      {
        context: {
          action: "delete_user",
          userId,
        },
        error,
      }
    );
    throw new Error("Failed to delete user");
  }
}
