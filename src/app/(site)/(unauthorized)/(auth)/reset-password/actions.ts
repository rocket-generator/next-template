"use server";

import {
  ResetPasswordRequestSchema,
  ResetPasswordRequest,
} from "@/requests/reset_password_request";
import { InvalidInput, Success } from "@/constants/auth";
import { AuthService } from "@/services/auth_service";

export async function resetPasswordAction(
  rawInput: ResetPasswordRequest
): Promise<typeof InvalidInput | typeof Success> {
  try {
    const validatedInput = ResetPasswordRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return InvalidInput;
    }

    const authService = new AuthService();
    await authService.resetPassword(validatedInput.data);

    return Success;
  } catch (error) {
    console.error("Password reset error:", error);
    return InvalidInput;
  }
}
