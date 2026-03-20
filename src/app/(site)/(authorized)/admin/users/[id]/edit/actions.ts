"use server";

import { UserUpdateRequest } from "@/requests/admin/user_update_request";
import { AuthService } from "@/services/auth_service";

export async function updateUser(
  id: string,
  data: UserUpdateRequest
): Promise<boolean> {
  const authService = new AuthService();

  try {
    await authService.updateUser(id, data);
    return true;
  } catch (error) {
    console.error("Failed to update user:", error);
    throw new Error("Failed to update user");
  }
  return false;
}
