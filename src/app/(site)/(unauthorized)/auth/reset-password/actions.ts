"use server";

import {
  ResetPasswordRequestSchema,
  ResetPasswordRequest,
} from "@/requests/reset_password_request";
import { InvalidInput, Success } from "@/constants/auth";
import { UserRepository } from "@/repositories/user_repository";

export async function resetPasswordAction(
  rawInput: ResetPasswordRequest
): Promise<typeof InvalidInput | typeof Success> {
  try {
    const validatedInput = ResetPasswordRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return InvalidInput;
    }

    const authRepository = new UserRepository();
    await authRepository.postResetPassword(validatedInput.data);

    return Success;
  } catch (error) {
    console.error("Password reset error:", error);
    return InvalidInput;
  }
}
