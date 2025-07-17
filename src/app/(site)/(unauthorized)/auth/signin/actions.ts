"use server";

import { SignInRequestSchema, SignInRequest } from "@/requests/signin_request";
import { signIn } from "@/libraries/auth";
import { AuthError } from "next-auth";
import { InvalidInput, InvalidCredentials, Success } from "@/constants/auth";

export async function signInAction(
  rawInput: SignInRequest
): Promise<typeof InvalidInput | typeof InvalidCredentials | typeof Success> {
  try {
    const validatedInput = SignInRequestSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return InvalidInput;
    }

    const result = await signIn("signin", {
      ...validatedInput.data,
      redirect: false,
    });
    console.log(result);
    if (!result || result.error) {
      return InvalidCredentials;
    }

    return Success;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Sign in error:", error.type);
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
    console.error("Unexpected error:", error);
    // 予期せぬエラーの場合も InvalidCredentials を返す
    return InvalidCredentials;
  }
}
