jest.mock("@/libraries/auth", () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock("@/services/auth_service", () => ({
  __esModule: true,
  AuthService: jest.fn(),
}));

jest.mock("@/repositories/user_repository", () => ({
  __esModule: true,
  UserRepository: jest.fn(),
}));

jest.mock("next/cache", () => ({
  __esModule: true,
  revalidatePath: jest.fn(),
}));

import {
  changePassword,
  getCurrentUser,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "@/app/(site)/(authorized)/(app)/settings/actions";
import {
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

type AuthModule = {
  auth: jest.Mock;
};

type AuthServiceModule = {
  AuthService: jest.Mock;
};

type UserRepositoryModule = {
  UserRepository: jest.Mock;
};

type NextCacheModule = {
  revalidatePath: jest.Mock;
};

const getAuthMock = () => (jest.requireMock("@/libraries/auth") as AuthModule).auth;

const getAuthServiceMock = () =>
  (jest.requireMock("@/services/auth_service") as AuthServiceModule).AuthService;

const getUserRepositoryMock = () =>
  (jest.requireMock("@/repositories/user_repository") as UserRepositoryModule)
    .UserRepository;

const getRevalidatePathMock = () =>
  (jest.requireMock("next/cache") as NextCacheModule).revalidatePath;

describe("settings actions", () => {
  let authService: {
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
  };
  let userRepository: {
    uploadUserAvatar: jest.Mock;
    generateUserAvatarUrl: jest.Mock;
    deleteUserAvatar: jest.Mock;
    getUserById: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    installTestLoggerAdapters();

    authService = {
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    };
    userRepository = {
      uploadUserAvatar: jest.fn(),
      generateUserAvatarUrl: jest.fn(),
      deleteUserAvatar: jest.fn(),
      getUserById: jest.fn(),
    };

    getAuthMock().mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getAuthServiceMock().mockImplementation(() => authService);
    getUserRepositoryMock().mockImplementation(() => userRepository);
  });

  afterEach(() => {
    resetTestLoggerState();
  });

  describe("updateProfile", () => {
    it("未認証なら Unauthorized を返す", async () => {
      getAuthMock().mockResolvedValue(null);

      const result = await updateProfile({
        name: "Alice",
        email: "alice@example.com",
      });

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("Zod エラー時に field を返す", async () => {
      const result = await updateProfile({
        name: "Alice",
        email: "",
      });

      expect(result).toEqual({
        success: false,
        error: "email_required",
        field: "email",
      });
      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it("成功時に AuthService を呼び revalidatePath する", async () => {
      authService.updateProfile.mockResolvedValue(undefined);

      const result = await updateProfile({
        name: "Alice",
        email: "alice@example.com",
      });

      expect(authService.updateProfile).toHaveBeenCalledWith("user-1", {
        name: "Alice",
        email: "alice@example.com",
      });
      expect(getRevalidatePathMock()).toHaveBeenCalledWith("/settings");
      expect(result).toEqual({
        success: true,
        message: "profile_updated",
      });
    });

    it("例外時は error.message を返し logger.error を呼ぶ", async () => {
      authService.updateProfile.mockRejectedValue(new Error("profile_error"));

      const result = await updateProfile({
        name: "Alice",
        email: "alice@example.com",
      });

      expect(result).toEqual({
        success: false,
        error: "profile_error",
      });
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "settings_actions",
          event: "settings_actions.update_profile.failed",
          context: expect.objectContaining({
            action: "update_profile",
          }),
        }),
      ]);
    });
  });

  describe("changePassword", () => {
    it("invalid_current_password を currentPassword フィールドエラーに変換する", async () => {
      authService.changePassword.mockRejectedValue(
        new Error("invalid_current_password")
      );

      const result = await changePassword({
        currentPassword: "wrong-password",
        newPassword: "Password123!",
        confirmPassword: "Password123!",
      });

      expect(result).toEqual({
        success: false,
        error: "invalid_current_password",
        field: "currentPassword",
      });
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "settings_actions",
          event: "settings_actions.change_password.failed",
          context: expect.objectContaining({
            action: "change_password",
          }),
        }),
      ]);
    });
  });

  describe("uploadAvatar", () => {
    it("未認証なら Unauthorized を返す", async () => {
      getAuthMock().mockResolvedValue(null);

      const result = await uploadAvatar(new FormData());

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("ファイル未指定なら avatar_invalid_format を返す", async () => {
      const result = await uploadAvatar(new FormData());

      expect(result).toEqual({
        success: false,
        error: "avatar_invalid_format",
      });
    });

    it("2MB 超過なら avatar_too_large を返す", async () => {
      const formData = new FormData();
      const file = new File(
        [new Uint8Array(2 * 1024 * 1024 + 1)],
        "avatar.png",
        {
          type: "image/png",
        }
      );
      formData.set("avatar", file);

      const result = await uploadAvatar(formData);

      expect(result).toEqual({
        success: false,
        error: "avatar_too_large",
      });
    });

    it("JPEG/PNG 以外なら avatar_invalid_format を返す", async () => {
      const formData = new FormData();
      const file = new File(["hello"], "avatar.txt", {
        type: "text/plain",
      });
      formData.set("avatar", file);

      const result = await uploadAvatar(formData);

      expect(result).toEqual({
        success: false,
        error: "avatar_invalid_format",
      });
    });

    it("成功時に upload と URL 生成を行う", async () => {
      userRepository.uploadUserAvatar.mockResolvedValue(undefined);
      userRepository.generateUserAvatarUrl.mockResolvedValue(
        "http://localhost:3000/avatar.png"
      );

      const formData = new FormData();
      const file = new File(["avatar"], "avatar.png", {
        type: "image/png",
      });
      Object.defineProperty(file, "arrayBuffer", {
        value: async () => new TextEncoder().encode("avatar").buffer,
      });
      formData.set("avatar", file);

      const result = await uploadAvatar(formData);

      expect(userRepository.uploadUserAvatar).toHaveBeenCalledWith(
        "user-1",
        expect.any(Buffer),
        "image/png"
      );
      expect(userRepository.generateUserAvatarUrl).toHaveBeenCalledWith(
        "user-1"
      );
      expect(getRevalidatePathMock()).toHaveBeenCalledWith("/settings");
      expect(result).toEqual({
        success: true,
        message: "avatar_updated",
        avatarUrl: "http://localhost:3000/avatar.png",
      });
    });

    it("例外時は error.message を返し logger.error を呼ぶ", async () => {
      userRepository.uploadUserAvatar.mockRejectedValue(new Error("avatar_error"));

      const formData = new FormData();
      const file = new File(["avatar"], "avatar.png", {
        type: "image/png",
      });
      Object.defineProperty(file, "arrayBuffer", {
        value: async () => new TextEncoder().encode("avatar").buffer,
      });
      formData.set("avatar", file);

      const result = await uploadAvatar(formData);

      expect(result).toEqual({
        success: false,
        error: "avatar_error",
      });
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "settings_actions",
          event: "settings_actions.upload_avatar.failed",
          context: expect.objectContaining({
            action: "upload_avatar",
          }),
        }),
      ]);
    });
  });

  describe("removeAvatar", () => {
    it("未認証なら Unauthorized を返す", async () => {
      getAuthMock().mockResolvedValue(null);

      const result = await removeAvatar();

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("成功時は avatar_updated を返す", async () => {
      userRepository.deleteUserAvatar.mockResolvedValue(undefined);

      const result = await removeAvatar();

      expect(userRepository.deleteUserAvatar).toHaveBeenCalledWith("user-1");
      expect(getRevalidatePathMock()).toHaveBeenCalledWith("/settings");
      expect(result).toEqual({
        success: true,
        message: "avatar_updated",
      });
    });

    it("例外時は error.message を返す", async () => {
      userRepository.deleteUserAvatar.mockRejectedValue(
        new Error("storage_error")
      );

      const result = await removeAvatar();

      expect(result).toEqual({
        success: false,
        error: "storage_error",
      });
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "settings_actions",
          event: "settings_actions.remove_avatar.failed",
          context: expect.objectContaining({
            action: "remove_avatar",
          }),
        }),
      ]);
    });
  });

  describe("getCurrentUser", () => {
    it("未認証なら null を返す", async () => {
      getAuthMock().mockResolvedValue(null);

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it("成功時は user と avatarUrl を返す", async () => {
      userRepository.getUserById.mockResolvedValue({
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
      });
      userRepository.generateUserAvatarUrl.mockResolvedValue(
        "http://localhost:3000/avatar.png"
      );

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
        avatarUrl: "http://localhost:3000/avatar.png",
      });
    });

    it("例外時は null を返す", async () => {
      userRepository.getUserById.mockRejectedValue(new Error("db_error"));

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "settings_actions",
          event: "settings_actions.get_current_user.failed",
          context: expect.objectContaining({
            action: "get_current_user",
          }),
        }),
      ]);
    });
  });
});
