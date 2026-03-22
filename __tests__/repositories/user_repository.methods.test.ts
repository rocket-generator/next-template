import { UserRepository } from "@/repositories/user_repository";
import { getPrismaModel } from "@/repositories/prisma_repository";

jest.mock("@/libraries/auth", () => ({
  auth: jest.fn(),
}));

const mockStorageService = {
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  generateSignedUrl: jest.fn(),
  deleteFile: jest.fn(),
  updateFile: jest.fn(),
  listFiles: jest.fn(),
};

jest.mock("@/libraries/storage", () => ({
  createStorageServiceInstance: jest.fn(() => mockStorageService),
}));

const mockUserModel = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

jest.mock("@/repositories/prisma_repository", () => ({
  ...jest.requireActual("@/repositories/prisma_repository"),
  getPrismaModel: jest.fn(() => mockUserModel),
}));

const createPrismaUser = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  email: "user@example.com",
  name: "Example User",
  permissions: ["user"],
  language: "ja",
  avatarKey: undefined,
  isActive: true,
  emailVerified: false,
  createdAt: new Date("2026-03-22T00:00:00.000Z"),
  updatedAt: new Date("2026-03-22T00:00:00.000Z"),
  ...overrides,
});

describe("UserRepository methods", () => {
  let repository: UserRepository;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe("getUserById", () => {
    it("should fetch a user by id and transform the Prisma payload", async () => {
      mockUserModel.findUnique.mockResolvedValue(createPrismaUser());

      const result = await repository.getUserById("user-1");

      expect(getPrismaModel).toHaveBeenCalledWith("user");
      expect(mockUserModel.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: "user-1",
          email: "user@example.com",
          name: "Example User",
          permissions: ["user"],
        })
      );
    });

    it("should throw when the user does not exist", async () => {
      mockUserModel.findUnique.mockResolvedValue(null);

      await expect(repository.getUserById("missing-user")).rejects.toThrow(
        "User with id missing-user not found"
      );
    });
  });

  describe("updateUserData", () => {
    it("should update a user and return the transformed user", async () => {
      mockUserModel.update.mockResolvedValue(
        createPrismaUser({ name: "Updated User", avatarKey: "avatars/user-1" })
      );

      const result = await repository.updateUserData("user-1", {
        name: "Updated User",
        avatarKey: "avatars/user-1",
      });

      expect(getPrismaModel).toHaveBeenCalledWith("user");
      expect(mockUserModel.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          name: "Updated User",
          avatarKey: "avatars/user-1",
        },
      });
      expect(result).toEqual(
        expect.objectContaining({
          name: "Updated User",
          avatarKey: "avatars/user-1",
        })
      );
    });
  });

  describe("uploadUserAvatar", () => {
    it("should delete the previous avatar, upload a new file and persist the avatar key", async () => {
      const imageData = Buffer.from("avatar");
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_717_111_111_000);
      const deleteSpy = jest
        .spyOn(repository, "deleteUserAvatar")
        .mockResolvedValue(undefined);
      const updateSpy = jest
        .spyOn(repository, "updateUserData")
        .mockResolvedValue(
          createPrismaUser({
            avatarKey: "avatars/user-1/1717111111000",
          })
        );
      mockStorageService.uploadFile.mockResolvedValue({
        success: true,
        key: "avatars/user-1/1717111111000",
      });

      const result = await repository.uploadUserAvatar(
        "user-1",
        imageData,
        "image/png"
      );

      expect(deleteSpy).toHaveBeenCalledWith("user-1", false);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        "avatars/user-1/1717111111000",
        imageData,
        "image/png"
      );
      expect(updateSpy).toHaveBeenCalledWith("user-1", {
        avatarKey: "avatars/user-1/1717111111000",
      });
      expect(result).toEqual(
        expect.objectContaining({
          avatarKey: "avatars/user-1/1717111111000",
        })
      );

      nowSpy.mockRestore();
    });

    it("should throw when upload fails", async () => {
      jest.spyOn(repository, "deleteUserAvatar").mockResolvedValue(undefined);
      mockStorageService.uploadFile.mockResolvedValue({
        success: false,
        key: "avatars/user-1/failed",
        error: "storage is unavailable",
      });

      await expect(
        repository.uploadUserAvatar("user-1", Buffer.from("avatar"))
      ).rejects.toThrow("Failed to upload avatar: storage is unavailable");
    });
  });

  describe("deleteUserAvatar", () => {
    it("should delete the avatar file and clear the avatar key", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      const updateSpy = jest
        .spyOn(repository, "updateUserData")
        .mockResolvedValue(createPrismaUser({ avatarKey: undefined }));

      const result = await repository.deleteUserAvatar("user-1");

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        "avatars/user-1/current"
      );
      expect(updateSpy).toHaveBeenCalledWith("user-1", {
        avatarKey: undefined,
      });
      expect(result).toEqual(
        expect.objectContaining({
          avatarKey: undefined,
        })
      );
    });

    it("should continue updating the user even if file deletion fails", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      const updateSpy = jest
        .spyOn(repository, "updateUserData")
        .mockResolvedValue(createPrismaUser({ avatarKey: undefined }));
      mockStorageService.deleteFile.mockRejectedValue(new Error("s3 error"));

      await repository.deleteUserAvatar("user-1");

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith("user-1", {
        avatarKey: undefined,
      });
    });

    it("should return the existing user when there is no avatar", async () => {
      const user = createPrismaUser();
      jest.spyOn(repository, "getUserById").mockResolvedValue(user);
      const updateSpy = jest.spyOn(repository, "updateUserData");

      const result = await repository.deleteUserAvatar("user-1");

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it("should skip the user update when updateUser is false", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      const updateSpy = jest.spyOn(repository, "updateUserData");

      const result = await repository.deleteUserAvatar("user-1", false);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        "avatars/user-1/current"
      );
      expect(updateSpy).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe("generateUserAvatarUrl", () => {
    it("should return null when the user has no avatar", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(createPrismaUser());

      const result = await repository.generateUserAvatarUrl("user-1");

      expect(mockStorageService.generateSignedUrl).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should generate a signed URL with the provided expiry", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      mockStorageService.generateSignedUrl.mockResolvedValue(
        "https://example.com/avatar"
      );

      const result = await repository.generateUserAvatarUrl("user-1", 1800);

      expect(mockStorageService.generateSignedUrl).toHaveBeenCalledWith(
        "avatars/user-1/current",
        1800
      );
      expect(result).toBe("https://example.com/avatar");
    });

    it("should return null when signed URL generation fails", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      mockStorageService.generateSignedUrl.mockRejectedValue(
        new Error("sign failed")
      );

      const result = await repository.generateUserAvatarUrl("user-1");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("downloadUserAvatar", () => {
    it("should return null when the user has no avatar", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(createPrismaUser());

      const result = await repository.downloadUserAvatar("user-1");

      expect(mockStorageService.downloadFile).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return the downloaded avatar buffer", async () => {
      const data = Buffer.from("avatar-binary");
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      mockStorageService.downloadFile.mockResolvedValue({
        success: true,
        data,
      });

      const result = await repository.downloadUserAvatar("user-1");

      expect(mockStorageService.downloadFile).toHaveBeenCalledWith(
        "avatars/user-1/current"
      );
      expect(result).toEqual(data);
    });

    it("should return null when the storage download result is unsuccessful", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      mockStorageService.downloadFile.mockResolvedValue({
        success: false,
        error: "not found",
      });

      const result = await repository.downloadUserAvatar("user-1");

      expect(result).toBeNull();
    });

    it("should return null when avatar download throws", async () => {
      jest.spyOn(repository, "getUserById").mockResolvedValue(
        createPrismaUser({
          avatarKey: "avatars/user-1/current",
        })
      );
      mockStorageService.downloadFile.mockRejectedValue(
        new Error("download failed")
      );

      const result = await repository.downloadUserAvatar("user-1");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
