"use server";

import { UserRepository } from "@/repositories/user_repository";
import { UserUpdateRequest } from "@/requests/admin/user_update_request";
import { hashPassword } from "@/libraries/hash";

export async function updateUser(
  id: string,
  data: UserUpdateRequest
): Promise<boolean> {
  const repository = new UserRepository();

  try {
    // パスワードが空でない場合のみハッシュ化して更新データに含める
    const updateData = { ...data };
    if (data.password && data.password.trim() !== "") {
      updateData.password = await hashPassword(data.password);
    } else {
      // パスワードが空の場合は更新データから除外
      delete updateData.password;
    }

    await repository.update(id, updateData);
    return true;
  } catch (error) {
    console.error("Failed to update user:", error);
    throw new Error("Failed to update user");
  }
  return false;
}
