jest.mock("@/services/auth_service", () => ({
  __esModule: true,
  AuthService: jest.fn(),
}));

jest.mock("@/repositories/user_repository", () => ({
  __esModule: true,
  UserRepository: jest.fn(),
}));

import { createUser } from "@/app/(site)/(authorized)/admin/users/create/actions";
import { deleteUser } from "@/app/(site)/(authorized)/admin/users/[id]/actions";
import { updateUser } from "@/app/(site)/(authorized)/admin/users/[id]/edit/actions";
import {
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

type AuthServiceModule = {
  AuthService: jest.Mock;
};

type UserRepositoryModule = {
  UserRepository: jest.Mock;
};

const getAuthServiceMock = () =>
  (jest.requireMock("@/services/auth_service") as AuthServiceModule)
    .AuthService;

const getUserRepositoryMock = () =>
  (jest.requireMock("@/repositories/user_repository") as UserRepositoryModule)
    .UserRepository;

describe("admin user actions", () => {
  let authService: {
    createUser: jest.Mock;
    updateUser: jest.Mock;
  };
  let userRepository: {
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    installTestLoggerAdapters();

    authService = {
      createUser: jest.fn(),
      updateUser: jest.fn(),
    };
    userRepository = {
      delete: jest.fn(),
    };

    getAuthServiceMock().mockImplementation(() => authService);
    getUserRepositoryMock().mockImplementation(() => userRepository);
  });

  afterEach(() => {
    resetTestLoggerState();
  });

  it("createUser should log and rethrow when AuthService fails", async () => {
    authService.createUser.mockRejectedValue(new Error("boom"));

    await expect(
      createUser({
        name: "Alice",
        email: "alice@example.com",
        password: "Password123!",
        permissions: ["admin"],
      })
    ).rejects.toThrow("Failed to create user");

    expect(getLoggedEntries()).toEqual([
      expect.objectContaining({
        level: "error",
        scope: "admin_users_create_actions",
        event: "admin_users_create_actions.create_user.failed",
        context: expect.objectContaining({
          action: "create_user",
        }),
      }),
    ]);
  });

  it("deleteUser should log and rethrow when repository delete fails", async () => {
    userRepository.delete.mockRejectedValue(new Error("boom"));

    await expect(deleteUser("user-1")).rejects.toThrow("Failed to delete user");

    expect(getLoggedEntries()).toEqual([
      expect.objectContaining({
        level: "error",
        scope: "admin_user_actions",
        event: "admin_user_actions.delete_user.failed",
        context: expect.objectContaining({
          action: "delete_user",
          userId: "user-1",
        }),
      }),
    ]);
  });

  it("updateUser should log and rethrow when AuthService fails", async () => {
    authService.updateUser.mockRejectedValue(new Error("boom"));

    await expect(
      updateUser("user-1", {
        name: "Alice",
        email: "alice@example.com",
        password: "Password123!",
        permissions: ["admin"],
      })
    ).rejects.toThrow("Failed to update user");

    expect(getLoggedEntries()).toEqual([
      expect.objectContaining({
        level: "error",
        scope: "admin_user_edit_actions",
        event: "admin_user_edit_actions.update_user.failed",
        context: expect.objectContaining({
          action: "update_user",
          userId: "user-1",
        }),
      }),
    ]);
  });
});
