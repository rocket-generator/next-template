"use server";

import { SignInRequestSchema, SignInRequest } from "@/requests/signin_request";
import {
  InvalidInput,
  InvalidCredentials,
  Success,
  EmailVerificationRequired,
} from "@/constants/auth";
import { AuthService } from "@/services/auth_service";

export async function signInAction(
  rawInput: SignInRequest
): Promise<
  | typeof InvalidInput
  | typeof InvalidCredentials
  | typeof Success
  | typeof EmailVerificationRequired
> {
  try {
    const validatedInput = SignInRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return InvalidInput;
    }

    const authService = new AuthService();
    const result = await authService.signIn(validatedInput.data);

    if (result.success) {
      return Success;
    }

    if (result.reason === "email_not_verified") {
      return EmailVerificationRequired;
    }

    return InvalidCredentials;
  } catch (error) {
    console.error("Sign in error:", error);
    return InvalidCredentials;
  }
}
