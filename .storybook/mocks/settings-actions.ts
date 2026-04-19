export type ProfileUpdateResult =
  | { success: true; message: string }
  | { success: false; error: string; field?: string };

export type PasswordChangeResult =
  | { success: true; message: string }
  | { success: false; error: string; field?: string };

export type AvatarUploadResult =
  | { success: true; message: string; avatarUrl?: string }
  | { success: false; error: string };

export async function updateProfile(): Promise<ProfileUpdateResult> {
  return { success: true, message: "profile_updated" };
}

export async function changePassword(): Promise<PasswordChangeResult> {
  return { success: true, message: "password_updated" };
}

export async function uploadAvatar(): Promise<AvatarUploadResult> {
  return {
    success: true,
    message: "avatar_updated",
    avatarUrl: "https://example.com/avatar.png",
  };
}

export async function removeAvatar(): Promise<AvatarUploadResult> {
  return { success: true, message: "avatar_updated" };
}

export async function getCurrentUser() {
  return {
    id: "storybook-user",
    name: "Storybook User",
    email: "storybook@example.com",
    avatarUrl: "https://example.com/avatar.png",
  };
}
