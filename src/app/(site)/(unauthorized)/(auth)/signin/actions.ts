"use server";

import { SignInRequestSchema, SignInRequest } from "@/requests/signin_request";
import { signIn, syncCredentialAccount } from "@/libraries/auth";
import {
  InvalidInput,
  InvalidCredentials,
  Success,
  EmailVerificationRequired,
} from "@/constants/auth";
import { UserRepository } from "@/repositories/user_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
import { AuthService, EmailNotVerifiedError } from "@/services/auth_service";

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

    const userRepository = new UserRepository();
    const passwordResetRepository = new PasswordResetRepository();
    const emailVerificationRepository = new EmailVerificationRepository();
    const authService = new AuthService(
      userRepository,
      passwordResetRepository,
      emailVerificationRepository
    );

    const response = await authService.signIn(validatedInput.data);
    const user = await userRepository.getUserById(response.id);

    await syncCredentialAccount({
      userId: user.id,
      email: user.email,
      passwordHash: user.password,
    });

    const signInResult = await signIn({
      email: validatedInput.data.email,
      password: validatedInput.data.password,
      accessToken: response.access_token,
      permissions: response.permissions ?? [],
    });

    console.log("signInResult", signInResult);

    if (signInResult.success) {
      return Success;
    }

    if (signInResult.reason === "email_not_verified") {
      return EmailVerificationRequired;
    }

    return InvalidCredentials;
  } catch (error) {
    if (error instanceof EmailNotVerifiedError) {
      return EmailVerificationRequired;
    }
    console.error("Sign in error:", error);
    // 予期せぬエラーの場合も InvalidCredentials を返す
    return InvalidCredentials;
  }
}
