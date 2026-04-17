"use server";

import { createLogger } from "@/libraries/logger";
import { UserCreateRequest } from "@/requests/admin/user_create_request";
import { AuthService } from "@/services/auth_service";

const adminUsersCreateActionsLogger = createLogger("admin_users_create_actions");

export async function createUser(
  data: UserCreateRequest
): Promise<string | null> {
  "use server";
  const authService = new AuthService();

  try {
    const user = await authService.createUser(data);
    return user.id;
  } catch (error) {
    adminUsersCreateActionsLogger.error(
      "admin_users_create_actions.create_user.failed",
      "Failed to create user",
      {
        context: {
          action: "create_user",
        },
        error,
      }
    );
    throw new Error("Failed to create user");
  }
  return null;
}
