"use server";

import {
  ResetPasswordRequestSchema,
  ResetPasswordRequest,
} from "@/requests/reset_password_request";
import { InvalidInput, Success } from "@/constants/auth";
import { UserRepository } from "@/repositories/user_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { AuthService } from "@/services/auth_service";

export async function resetPasswordAction(
  rawInput: ResetPasswordRequest
): Promise<typeof InvalidInput | typeof Success> {
  try {
    const validatedInput = ResetPasswordRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return InvalidInput;
    }

    const userRepository = new UserRepository();
    const passwordResetRepository = new PasswordResetRepository();
    const authService = new AuthService(userRepository, passwordResetRepository);
    await authService.resetPassword(validatedInput.data);

    return Success;
  } catch (error) {
    console.error("Password reset error:", error);
    return InvalidInput;
  }
}
