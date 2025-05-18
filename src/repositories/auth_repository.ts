import { UserSchema } from "@/models/user";
import { APIClient } from "@/libraries/api_client";
import { SignInRequest } from "@/requests/signin_request";
import { AccessToken, AccessTokenSchema } from "@/models/access_token";
import { SignUpRequest } from "@/requests/signup_request";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { Status, StatusSchema } from "@/models/status";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { APIRepository } from "./api_repository";

export class AuthRepository extends APIRepository<typeof UserSchema> {
  public constructor(accessToken?: string) {
    super(UserSchema, "/auth", accessToken);
  }

  async postSignIn(request: SignInRequest): Promise<AccessToken> {
    const data = await APIClient<AccessToken>({
      path: `/auth/signin`,
      accessToken: undefined,
      method: "POST",
      body: request,
    });
    return AccessTokenSchema.parse(data);
  }

  async postSignUp(request: SignUpRequest): Promise<AccessToken> {
    const data = await APIClient<AccessToken>({
      path: `/auth/signup`,
      accessToken: undefined,
      method: "POST",
      body: request,
    });
    return AccessTokenSchema.parse(data);
  }

  async postForgotPassword(request: ForgotPasswordRequest): Promise<Status> {
    const data = await APIClient<Status>({
      path: `/auth/password/forgot`,
      accessToken: undefined,
      method: "POST",
      body: request,
    });
    return StatusSchema.parse(data);
  }

  async postResetPassword(request: ResetPasswordRequest): Promise<Status> {
    const data = await APIClient<Status>({
      path: `/auth/password/reset`,
      accessToken: undefined,
      method: "POST",
      body: request,
    });
    return StatusSchema.parse(data);
  }
}
