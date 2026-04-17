"use server";

import {
  ForgotPasswordRequestSchema,
  ForgotPasswordRequest,
} from "@/requests/forgot_password_request";
import { InvalidInput, Success } from "@/constants/auth";
import { createLogger } from "@/libraries/logger";
import { AuthService } from "@/services/auth_service";

const forgotPasswordActionsLogger = createLogger("forgot_password_actions");

export async function forgotPasswordAction(
  rawInput: ForgotPasswordRequest
): Promise<typeof InvalidInput | typeof Success> {
  try {
    const validatedInput = ForgotPasswordRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return InvalidInput;
    }

    const authService = new AuthService();
    await authService.forgotPassword(validatedInput.data);

    return Success;
  } catch (error) {
    forgotPasswordActionsLogger.error(
      "forgot_password_actions.forgot_password.failed",
      "Failed to request password reset",
      {
        context: {
          action: "forgot_password",
        },
        error,
      }
    );
    return InvalidInput;
  }
}
