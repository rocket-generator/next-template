"use server";

import { SignUpRequestSchema, SignUpRequest } from "@/requests/signup_request";
import { AuthService } from "@/services/auth_service";
import {
  InvalidInput,
  InvalidCredentials,
  Success,
  EmailVerificationRequired,
} from "@/constants/auth";
import { createLogger } from "@/libraries/logger";

const signUpActionsLogger = createLogger("signup_actions");

export async function signUpAction(
  rawInput: SignUpRequest
): Promise<
  | typeof InvalidInput
  | typeof InvalidCredentials
  | typeof Success
  | typeof EmailVerificationRequired
> {
  try {
    const validatedInput = SignUpRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) return InvalidInput;

    const authService = new AuthService();

    const result = await authService.signUp(validatedInput.data);

    if (!result.success) {
      return InvalidCredentials;
    }

    return result.requiresEmailVerification
      ? EmailVerificationRequired
      : Success;
  } catch (error) {
    signUpActionsLogger.error(
      "signup_actions.sign_up.failed",
      "Failed to sign up",
      {
        context: {
          action: "sign_up",
        },
        error,
      }
    );
    return InvalidCredentials;
  }
}
