"use server";

import { createLogger } from "@/libraries/logger";
import { UserUpdateRequest } from "@/requests/admin/user_update_request";
import { AuthService } from "@/services/auth_service";

const adminUserEditActionsLogger = createLogger("admin_user_edit_actions");

export async function updateUser(
  id: string,
  data: UserUpdateRequest
): Promise<boolean> {
  const authService = new AuthService();

  try {
    await authService.updateUser(id, data);
    return true;
  } catch (error) {
    adminUserEditActionsLogger.error(
      "admin_user_edit_actions.update_user.failed",
      "Failed to update user",
      {
        context: {
          action: "update_user",
          userId: id,
        },
        error,
      }
    );
    throw new Error("Failed to update user");
  }
  return false;
}
