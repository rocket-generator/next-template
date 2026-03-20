import { getTranslations } from "next-intl/server";

import { buildAppUrl, buildHeaders, betterAuthHandler } from "@/libraries/auth";
import { hashPassword } from "@/libraries/hash";
import { prisma } from "@/libraries/prisma";
import { Status, StatusSchema } from "@/models/status";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { PasswordChangeRequest } from "@/requests/password_change_request";
import { ProfileUpdateRequest } from "@/requests/profile_update_request";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { SignInRequest } from "@/requests/signin_request";
import { SignUpRequest } from "@/requests/signup_request";
import { UserCreateRequest } from "@/requests/admin/user_create_request";
import { UserUpdateRequest } from "@/requests/admin/user_update_request";
import { User, transformPrismToModel } from "@/models/user";

type AuthFlowResult =
  | { success: true; requiresEmailVerification?: boolean }
  | { success: false; reason: "invalid_credentials" | "email_not_verified" };

function isEmailVerificationEnabled(): boolean {
  return process.env.ENABLE_EMAIL_VERIFICATION === "true";
}

async function extractAuthErrorMessage(error: unknown): Promise<string> {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof Response !== "undefined" && error instanceof Response) {
    try {
      const payload = (await error.clone().json()) as Record<string, unknown>;
      if (typeof payload.message === "string") {
        return payload.message;
      }
    } catch {
      return error.statusText ?? "";
    }
  }

  if (typeof error === "object") {
    const payload = error as Record<string, unknown>;

    if (typeof payload.message === "string") {
      return payload.message;
    }

    if (typeof payload.error === "string") {
      return payload.error;
    }
  }

  return "";
}

export class AuthService {
  async signIn(request: SignInRequest): Promise<AuthFlowResult> {
    const user = await prisma.user.findUnique({
      where: { email: request.email.toLowerCase() },
      select: {
        isActive: true,
      },
    });

    if (user && user.isActive === false) {
      return { success: false, reason: "invalid_credentials" };
    }

    try {
      await betterAuthHandler.api.signInEmail({
        headers: await buildHeaders(),
        body: {
          email: request.email,
          password: request.password,
          rememberMe: true,
        },
      });

      return { success: true };
    } catch (error) {
      const message = await extractAuthErrorMessage(error);

      if (message === "Email not verified") {
        return { success: false, reason: "email_not_verified" };
      }

      return { success: false, reason: "invalid_credentials" };
    }
  }

  async signUp(request: SignUpRequest): Promise<AuthFlowResult> {
    try {
      const result = await betterAuthHandler.api.signUpEmail({
        headers: await buildHeaders(),
        body: {
          email: request.email,
          password: request.password,
          name: request.name,
          permissions: [],
          isActive: true,
          language: "",
        },
      });

      if (!isEmailVerificationEnabled()) {
        await prisma.user.update({
          where: { id: result.user.id },
          data: { emailVerified: true },
        });
      }

      return {
        success: true,
        requiresEmailVerification: result.token == null,
      };
    } catch (error) {
      const message = await extractAuthErrorMessage(error);

      if (message === "Email not verified") {
        return { success: false, reason: "email_not_verified" };
      }

      return { success: false, reason: "invalid_credentials" };
    }
  }

  async verifyEmail(token: string): Promise<Status> {
    const t = await getTranslations("Auth");

    if (!isEmailVerificationEnabled()) {
      return StatusSchema.parse({
        success: false,
        message: t("email_verification_not_enabled"),
        code: 400,
      });
    }

    try {
      const result = await betterAuthHandler.api.verifyEmail({
        headers: await buildHeaders(),
        query: { token },
      });

      return StatusSchema.parse({
        success: result?.status === true,
        message: t("email_verified_successfully"),
        code: 200,
      });
    } catch (error) {
      const message = await extractAuthErrorMessage(error);
      const invalidToken =
        message === "invalid_token" || message === "token_expired";

      return StatusSchema.parse({
        success: false,
        message: invalidToken
          ? t("invalid_or_expired_token")
          : t("email_verification_failed"),
        code: invalidToken ? 400 : 500,
      });
    }
  }

  async resendVerificationEmail(email: string): Promise<Status> {
    const t = await getTranslations("Auth");

    if (!isEmailVerificationEnabled()) {
      return StatusSchema.parse({
        success: false,
        message: t("email_verification_not_enabled"),
        code: 400,
      });
    }

    try {
      await betterAuthHandler.api.sendVerificationEmail({
        headers: await buildHeaders(),
        body: {
          email,
          callbackURL: buildAppUrl("/signin"),
        },
      });

      return StatusSchema.parse({
        success: true,
        message: t("verification_email_sent"),
        code: 200,
      });
    } catch (error) {
      const message = await extractAuthErrorMessage(error);

      return StatusSchema.parse({
        success: false,
        message:
          message === "Email is already verified"
            ? t("email_already_verified")
            : t("email_verification_failed"),
        code: message === "Email is already verified" ? 400 : 500,
      });
    }
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await betterAuthHandler.api.requestPasswordReset({
      headers: await buildHeaders(),
      body: {
        email: request.email,
      },
    });
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await betterAuthHandler.api.resetPassword({
      headers: await buildHeaders(),
      body: {
        token: request.token,
        newPassword: request.password,
      },
    });
  }

  async updateProfile(
    userId: string,
    request: ProfileUpdateRequest
  ): Promise<void> {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
      },
    });

    if (!currentUser) {
      throw new Error("user_not_found");
    }

    if (request.name !== currentUser.name) {
      await betterAuthHandler.api.updateUser({
        headers: await buildHeaders(),
        body: {
          name: request.name,
        },
      });
    }

    if (request.email !== currentUser.email) {
      if (isEmailVerificationEnabled()) {
        await betterAuthHandler.api.changeEmail({
          headers: await buildHeaders(),
          body: {
            newEmail: request.email,
            callbackURL: buildAppUrl("/settings"),
          },
        });
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            email: request.email.toLowerCase(),
            emailVerified: true,
          },
        });
      }
    }
  }

  async changePassword(
    _userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await betterAuthHandler.api.changePassword({
        headers: await buildHeaders(),
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
      });
    } catch (error) {
      const message = await extractAuthErrorMessage(error);

      if (message === "Invalid password") {
        throw new Error("invalid_current_password");
      }

      throw error;
    }
  }

  async createUser(request: UserCreateRequest): Promise<User> {
    const hashedPassword = await hashPassword(request.password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: request.email.toLowerCase(),
          name: request.name,
          permissions: request.permissions,
          avatarKey: request.avatarKey,
          language: "",
          isActive: true,
          emailVerified: true,
        },
      });

      await tx.account.create({
        data: {
          userId: createdUser.id,
          providerId: "credential",
          accountId: createdUser.id,
          password: hashedPassword,
        },
      });

      return createdUser;
    });

    return transformPrismToModel(user);
  }

  async updateUser(id: string, request: UserUpdateRequest): Promise<User> {
    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          email: request.email.toLowerCase(),
          name: request.name,
          permissions: request.permissions,
          avatarKey: request.avatarKey,
        },
      });

      if (request.password && request.password.trim() !== "") {
        const hashedPassword = await hashPassword(request.password);

        await tx.account.upsert({
          where: {
            providerId_accountId: {
              providerId: "credential",
              accountId: id,
            },
          },
          update: {
            userId: id,
            password: hashedPassword,
          },
          create: {
            userId: id,
            providerId: "credential",
            accountId: id,
            password: hashedPassword,
          },
        });
      }

      return updatedUser;
    });

    return transformPrismToModel(user);
  }
}

export type { AuthFlowResult };
