import { transformPrismToModel, User } from "@/models/user";
import { AuthSchema } from "@/models/auth";
import { AuthRepository } from "./auth_repository";
import { createLogger } from "@/libraries/logger";
import { createStorageServiceInstance } from "@/libraries/storage";
import { getPrismaModel } from "./prisma_repository";
import { z } from "zod";

const userRepositoryLogger = createLogger("user_repository");

// AuthSchemaベースの変換関数を作成
function transformPrismaToAuth(data: unknown): z.infer<typeof AuthSchema> {
  const userData = transformPrismToModel(data);
  // UserからAuthSchemaの要件を満たすデータを抽出
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    permissions: userData.permissions,
    isActive: userData.isActive,
    emailVerified: userData.emailVerified,
  };
}

function buildAvatarLogContext(
  userId: string,
  avatarKey: string,
  operation: "delete" | "signed_url" | "download"
) {
  return {
    userId,
    avatarKey,
    operation,
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
   * 注意: パスワードのハッシュ化はサービス層で行う
   */
  async updateUserData(userId: string, userData: Partial<User>): Promise<User> {
    // Prismaモデルを直接更新してUser型を返す
    const updatedPrismaUser = await getPrismaModel("user").update({
      where: { id: userId },
      data: userData,
    });

    return transformPrismToModel(updatedPrismaUser);
  }

  /**
   * アバター画像をアップロードしてユーザーのavatarKeyを更新する
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

    // ユーザーのavatarKeyを更新
    return this.updateUserData(userId, { avatarKey: avatarKey });
  }

  /**
   * ユーザーのアバター画像を削除する
   */
  async deleteUserAvatar(
    userId: string,
    updateUser: boolean = true
  ): Promise<User | void> {
    const user = await this.getUserById(userId);

    if (user.avatarKey) {
      try {
        await this.storageService.deleteFile(user.avatarKey);
      } catch (error) {
        userRepositoryLogger.warn(
          "user_repository.avatar.delete.failed",
          "Failed to delete avatar file",
          {
            context: buildAvatarLogContext(userId, user.avatarKey, "delete"),
            error,
          }
        );
        // ファイル削除に失敗してもユーザー更新は続行
      }

      if (updateUser) {
        return this.updateUserData(userId, { avatarKey: undefined });
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
    const user = await this.getUserById(userId);

    if (!user.avatarKey) {
      return null;
    }

    try {
      return await this.storageService.generateSignedUrl(
        user.avatarKey,
        expiresIn
      );
    } catch (error) {
      userRepositoryLogger.error(
        "user_repository.avatar.signed_url.failed",
        "Failed to generate avatar signed URL",
        {
          context: buildAvatarLogContext(userId, user.avatarKey, "signed_url"),
          error,
        }
      );
      return null;
    }
  }

  /**
   * ユーザーのアバター画像データをダウンロードする
   */
  async downloadUserAvatar(userId: string): Promise<Buffer | null> {
    const user = await this.getUserById(userId);

    if (!user.avatarKey) {
      return null;
    }

    try {
      const downloadResult = await this.storageService.downloadFile(
        user.avatarKey
      );

      if (downloadResult.success && downloadResult.data) {
        return downloadResult.data;
      }

      return null;
    } catch (error) {
      userRepositoryLogger.error(
        "user_repository.avatar.download.failed",
        "Failed to download avatar",
        {
          context: buildAvatarLogContext(userId, user.avatarKey, "download"),
          error,
        }
      );
      return null;
    }
  }
}
