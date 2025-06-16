"use server";

import {
  ForgotPasswordRequestSchema,
  ForgotPasswordRequest,
} from "@/requests/forgot_password_request";
import { InvalidInput, Success } from "@/constants/auth";
import { UserRepository } from "@/repositories/user_repository";

export async function forgotPasswordAction(
  rawInput: ForgotPasswordRequest
): Promise<typeof InvalidInput | typeof Success> {
  try {
    const validatedInput = ForgotPasswordRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return InvalidInput;
    }

    const authRepository = new UserRepository();
    await authRepository.postForgotPassword(validatedInput.data);

    return Success;
  } catch (error) {
    console.error("Password reset error:", error);
    return InvalidInput;
  }
}
