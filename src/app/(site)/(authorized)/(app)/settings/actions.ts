"use server";

import {
  ProfileUpdateRequest,
  ProfileUpdateRequestSchema,
} from "@/requests/profile_update_request";
import {
  PasswordChangeRequest,
  PasswordChangeRequestSchema,
} from "@/requests/password_change_request";
import { UserRepository } from "@/repositories/user_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
import { AuthService } from "@/services/auth_service";
import { auth } from "@/libraries/auth";
import { revalidatePath } from "next/cache";

export type ProfileUpdateResult =
  | { success: true; message: string }
  | { success: false; error: string; field?: string };

export type PasswordChangeResult =
  | { success: true; message: string }
  | { success: false; error: string; field?: string };

export type AvatarUploadResult =
  | { success: true; message: string; avatarUrl?: string }
  | { success: false; error: string };

/**
 * プロフィール情報を更新する
 */
export async function updateProfile(
  request: ProfileUpdateRequest
): Promise<ProfileUpdateResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedInput = ProfileUpdateRequestSchema.safeParse(request);
    if (!validatedInput.success) {
      const firstError = validatedInput.error.errors[0];
      return {
        success: false,
        error: firstError.message,
        field: firstError.path[0]?.toString(),
      };
    }

    const userRepository = new UserRepository();
    const passwordResetRepository = new PasswordResetRepository();
    const emailVerificationRepository = new EmailVerificationRepository();
    const authService = new AuthService(
      userRepository,
      passwordResetRepository,
      emailVerificationRepository
    );
    await authService.updateProfile(
      session.user.id,
      validatedInput.data.name,
      validatedInput.data.email
    );

    revalidatePath("/settings");
    return { success: true, message: "profile_updated" };
  } catch (error) {
    console.error("Profile update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "system_error",
    };
  }
}

/**
 * パスワードを変更する
 */
export async function changePassword(
  request: PasswordChangeRequest
): Promise<PasswordChangeResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedInput = PasswordChangeRequestSchema.safeParse(request);
    if (!validatedInput.success) {
      const firstError = validatedInput.error.errors[0];
      return {
        success: false,
        error: firstError.message,
        field: firstError.path[0]?.toString(),
      };
    }

    const userRepository = new UserRepository();
    const passwordResetRepository = new PasswordResetRepository();
    const emailVerificationRepository = new EmailVerificationRepository();
    const authService = new AuthService(
      userRepository,
      passwordResetRepository,
      emailVerificationRepository
    );
    await authService.changePassword(
      session.user.id,
      validatedInput.data.currentPassword,
      validatedInput.data.newPassword
    );

    revalidatePath("/settings");
    return { success: true, message: "password_updated" };
  } catch (error) {
    console.error("Password change failed:", error);

    // エラーメッセージの翻訳
    let errorMessage = "system_error";
    if (error instanceof Error) {
      if (error.message === "invalid_current_password") {
        errorMessage = "invalid_current_password";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
      field:
        error instanceof Error && error.message === "invalid_current_password"
          ? "currentPassword"
          : undefined,
    };
  }
}

/**
 * アバター画像をアップロードする
 */
export async function uploadAvatar(
  formData: FormData
): Promise<AvatarUploadResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("avatar") as File;
    if (!file) {
      return { success: false, error: "avatar_invalid_format" };
    }

    // ファイルサイズチェック（2MB）
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "avatar_too_large" };
    }

    // ファイル形式チェック
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return { success: false, error: "avatar_invalid_format" };
    }

    const userRepository = new UserRepository();
    const buffer = Buffer.from(await file.arrayBuffer());

    await userRepository.uploadUserAvatar(session.user.id, buffer, file.type);

    // アバターURLを生成
    const avatarUrl = await userRepository.generateUserAvatarUrl(
      session.user.id
    );

    revalidatePath("/settings");
    return {
      success: true,
      message: "avatar_updated",
      avatarUrl: avatarUrl || undefined,
    };
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "system_error",
    };
  }
}

/**
 * アバター画像を削除する
 */
export async function removeAvatar(): Promise<AvatarUploadResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userRepository = new UserRepository();
    await userRepository.deleteUserAvatar(session.user.id);

    revalidatePath("/settings");
    return { success: true, message: "avatar_updated" };
  } catch (error) {
    console.error("Avatar removal failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "system_error",
    };
  }
}

/**
 * 現在のユーザー情報を取得する
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const userRepository = new UserRepository();
    const user = await userRepository.getUserById(session.user.id);

    // アバターURLを生成
    const avatarUrl = await userRepository.generateUserAvatarUrl(
      session.user.id
    );

    return {
      ...user,
      avatarUrl,
      // パスワードは除外
      password: undefined,
    };
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}
