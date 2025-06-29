"use server";

import { SignUpRequestSchema, SignUpRequest } from "@/requests/signup_request";
import { signIn } from "@/libraries/auth";
import { AuthError } from "next-auth";
import { InvalidInput, InvalidCredentials, Success } from "@/constants/auth";

export async function signUpAction(
  rawInput: SignUpRequest
): Promise<typeof InvalidInput | typeof InvalidCredentials | typeof Success> {
  try {
    const validatedInput = SignUpRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) return InvalidInput;

    const result = await signIn("signup", {
      ...validatedInput.data,
      redirect: false,
    });
    if (!result || result.error) {
      return InvalidCredentials;
    }

    return Success;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Sign up error:", error.type);
      // AuthError のケースをより詳細に処理
      switch (error.type) {
        case "CredentialsSignin":
        case "CallbackRouteError":
          return InvalidCredentials;
        default:
          console.error("Unexpected auth error:", error);
          return InvalidCredentials;
      }
    }

    // 予期せぬエラーの場合も InvalidCredentials を返す
    return InvalidCredentials;
  }
}
