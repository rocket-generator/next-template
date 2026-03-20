"use server";

import { UserCreateRequest } from "@/requests/admin/user_create_request";
import { AuthService } from "@/services/auth_service";

export async function createUser(
  data: UserCreateRequest
): Promise<string | null> {
  "use server";
  const authService = new AuthService();

  try {
    const user = await authService.createUser(data);
    return user.id;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user");
  }
  return null;
}
