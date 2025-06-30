import { transformPrismToModel, User } from "@/models/user";
import { AuthSchema } from "@/models/auth";
import { AuthRepository } from "./auth_repository";
import { createStorageServiceInstance } from "@/libraries/storage";
import { getPrismaModel } from "./prisma_repository";
import { z } from "zod";

// AuthSchemaベースの変換関数を作成
function transformPrismaToAuth(data: unknown): z.infer<typeof AuthSchema> {
  const userData = transformPrismToModel(data);
  // UserからAuthSchemaの要件を満たすデータを抽出
  return {
    id: userData.id,
    email: userData.email,
    password: userData.password,
    name: userData.name,
    permissions: userData.permissions,
  };
}

export class UserRepository extends AuthRepository {
  private storageService = createStorageServiceInstance();

  public constructor() {
    // AuthSchemaベースのコンストラクタを使用
    super(AuthSchema, "user", transformPrismaToAuth, ["name"]);
  }

  /**
   * ユーザーをUser型として取得する
   */
  async getUserById(id: string): Promise<User> {
    // getPrismaModel関数を使用してPrismaモデルにアクセス
    const prismaData = await getPrismaModel("user").findUnique({
      where: { id },
    });

    if (!prismaData) {
      throw new Error(`User with id ${id} not found`);
    }

    return transformPrismToModel(prismaData);
  }

  /**
   * ユーザーデータを更新する（User型対応版）
   */
  async updateUserData(userId: string, userData: Partial<User>): Promise<User> {
    const updateData = { ...userData };

    // If password is provided and not empty, hash it
    if (updateData.password && updateData.password.trim() !== "") {
      const { hashPassword } = await import("@/libraries/hash");
      updateData.password = await hashPassword(updateData.password);
    } else {
      // Remove password from update data if it's empty
      delete updateData.password;
    }

    // Prismaモデルを直接更新してUser型を返す
    const updatedPrismaUser = await getPrismaModel("user").update({
      where: { id: userId },
      data: updateData,
    });

    return transformPrismToModel(updatedPrismaUser);
  }

  /**
   * アバター画像をアップロードしてユーザーのavatar_keyを更新する
   */
  async uploadUserAvatar(
    userId: string,
    imageData: Buffer | Uint8Array,
    contentType: string = "image/jpeg"
  ): Promise<User> {
    const avatarKey = `avatars/${userId}/${Date.now()}`;

    // 既存のアバターを削除
    await this.deleteUserAvatar(userId, false);

    // 新しいアバターをアップロード
    const uploadResult = await this.storageService.uploadFile(
      avatarKey,
      imageData,
      contentType
    );

    if (!uploadResult.success) {
      throw new Error(`Failed to upload avatar: ${uploadResult.error}`);
    }

    // ユーザーのavatar_keyを更新
    return this.updateUserData(userId, { avatar_key: avatarKey });
  }

  /**
   * ユーザーのアバター画像を削除する
   */
  async deleteUserAvatar(
    userId: string,
    updateUser: boolean = true
  ): Promise<User | void> {
    const user = (await this.findById(userId)) as User;

    if (user.avatar_key) {
      try {
        await this.storageService.deleteFile(user.avatar_key);
      } catch (error) {
        console.warn(`Failed to delete avatar file ${user.avatar_key}:`, error);
        // ファイル削除に失敗してもユーザー更新は続行
      }

      if (updateUser) {
        return this.updateUserData(userId, { avatar_key: undefined });
      }
    }

    if (updateUser) {
      return user;
    }
  }

  /**
   * ユーザーのアバター画像のSignedURLを生成する
   */
  async generateUserAvatarUrl(
    userId: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    const user = (await this.findById(userId)) as User;

    if (!user.avatar_key) {
      return null;
    }

    try {
      return await this.storageService.generateSignedUrl(
        user.avatar_key,
        expiresIn
      );
    } catch (error) {
      console.error(
        `Failed to generate signed URL for avatar ${user.avatar_key}:`,
        error
      );
      return null;
    }
  }

  /**
   * ユーザーのアバター画像データをダウンロードする
   */
  async downloadUserAvatar(userId: string): Promise<Buffer | null> {
    const user = (await this.findById(userId)) as User;

    if (!user.avatar_key) {
      return null;
    }

    try {
      const downloadResult = await this.storageService.downloadFile(
        user.avatar_key
      );

      if (downloadResult.success && downloadResult.data) {
        return downloadResult.data;
      }

      return null;
    } catch (error) {
      console.error(`Failed to download avatar ${user.avatar_key}:`, error);
      return null;
    }
  }
}
