"use server";

import { SignUpRequestSchema, SignUpRequest } from "@/requests/signup_request";
import { signIn, syncCredentialAccount } from "@/libraries/auth";
import { AuthService } from "@/services/auth_service";
import { UserRepository } from "@/repositories/user_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
import {
  InvalidInput,
  InvalidCredentials,
  Success,
  EmailVerificationRequired,
} from "@/constants/auth";

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

    // Use AuthService directly instead of NextAuth signIn
    const userRepository = new UserRepository();
    const passwordResetRepository = new PasswordResetRepository();
    const emailVerificationRepository = new EmailVerificationRepository();
    const authService = new AuthService(
      userRepository,
      passwordResetRepository,
      emailVerificationRepository
    );

    const result = await authService.signUp(validatedInput.data);

    // If result is null, email verification is required
    if (result === null) {
      return EmailVerificationRequired;
    }

    // If we get an AccessToken, try to sign in with NextAuth using the signin provider
    if (result.access_token) {
      const user = await userRepository.getUserById(result.id);

      await syncCredentialAccount({
        userId: user.id,
        email: user.email,
        passwordHash: user.password,
      });

      const signInResult = await signIn({
        email: validatedInput.data.email,
        password: validatedInput.data.password,
        accessToken: result.access_token,
        permissions: result.permissions ?? [],
      });

      if (signInResult.success) {
        return Success;
      }

      if (signInResult.reason === "email_not_verified") {
        return EmailVerificationRequired;
      }

      return InvalidCredentials;
    }

    return InvalidCredentials;
  } catch (error) {
    console.error("Sign up error:", error);
    if (error instanceof Error) {
      if (error.message.includes("User already exists")) {
        return InvalidCredentials;
      }
    }
    return InvalidCredentials;
  }
}
