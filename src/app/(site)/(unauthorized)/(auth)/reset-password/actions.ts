"use server";

import {
  ResetPasswordRequestSchema,
  ResetPasswordRequest,
} from "@/requests/reset_password_request";
import { InvalidInput, Success } from "@/constants/auth";
import { createLogger } from "@/libraries/logger";
import { AuthService } from "@/services/auth_service";

const resetPasswordActionsLogger = createLogger("reset_password_actions");

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
    resetPasswordActionsLogger.error(
      "reset_password_actions.reset_password.failed",
      "Failed to reset password",
      {
        context: {
          action: "reset_password",
        },
        error,
      }
    );
    return InvalidInput;
  }
}
