jest.mock("@/libraries/auth", () => ({
  __esModule: true,
  buildAppUrl: jest.fn((pathname: string) => `http://localhost:3000${pathname}`),
  buildHeaders: jest.fn(async () => new Headers([["x-test", "1"]])),
  getBetterAuthHandler: jest.fn(),
}));

jest.mock("@/libraries/hash", () => ({
  __esModule: true,
  hashPassword: jest.fn(),
}));

jest.mock("@/libraries/prisma", () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/models/user", () => ({
  __esModule: true,
  transformPrismToModel: jest.fn((user: Record<string, unknown>) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    permissions: user.permissions ?? [],
    avatarKey: user.avatarKey,
    isActive: user.isActive ?? true,
    emailVerified: user.emailVerified ?? false,
    language: user.language ?? "",
  })),
}));

import { AuthService } from "@/services/auth_service";

type LibrariesAuthModule = {
  buildAppUrl: jest.Mock;
  buildHeaders: jest.Mock;
  getBetterAuthHandler: jest.Mock;
};

type LibrariesHashModule = {
  hashPassword: jest.Mock;
};

type LibrariesPrismaModule = {
  prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
};

type ModelsUserModule = {
  transformPrismToModel: jest.Mock;
};

const getAuthModuleMocks = () =>
  jest.requireMock("@/libraries/auth") as LibrariesAuthModule;

const getHashMocks = () =>
  jest.requireMock("@/libraries/hash") as LibrariesHashModule;

const getPrismaMocks = () =>
  jest.requireMock("@/libraries/prisma") as LibrariesPrismaModule;

const getUserModelMocks = () =>
  jest.requireMock("@/models/user") as ModelsUserModule;

const createAuthHandler = () => ({
  api: {
    signInEmail: jest.fn(),
    signUpEmail: jest.fn(),
    verifyEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    updateUser: jest.fn(),
    changeEmail: jest.fn(),
    changePassword: jest.fn(),
  },
});

describe("AuthService", () => {
  let service: AuthService;
  let authHandler: ReturnType<typeof createAuthHandler>;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENABLE_EMAIL_VERIFICATION;

    service = new AuthService();
    authHandler = createAuthHandler();

    getAuthModuleMocks().buildAppUrl.mockImplementation(
      (pathname: string) => `http://localhost:3000${pathname}`
    );
    getAuthModuleMocks().buildHeaders.mockResolvedValue(
      new Headers([["x-test", "1"]])
    );
    getAuthModuleMocks().getBetterAuthHandler.mockReturnValue(authHandler);

    getPrismaMocks().prisma.user.findUnique.mockResolvedValue(null);
    getPrismaMocks().prisma.user.update.mockResolvedValue(null);
    getPrismaMocks().prisma.$transaction.mockReset();

    getHashMocks().hashPassword.mockResolvedValue("hashed-password");

    getUserModelMocks().transformPrismToModel.mockImplementation(
      (user: Record<string, unknown>) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        permissions: user.permissions ?? [],
        avatarKey: user.avatarKey,
        isActive: user.isActive ?? true,
        emailVerified: user.emailVerified ?? false,
        language: user.language ?? "",
      })
    );
  });

  describe("signIn", () => {
    it("isActive=false のユーザーを Better Auth 呼び出し前に弾く", async () => {
      getPrismaMocks().prisma.user.findUnique.mockResolvedValue({
        isActive: false,
      });

      const result = await service.signIn({
        email: "USER@example.com",
        password: "Password123!",
      });

      expect(result).toEqual({
        success: false,
        reason: "invalid_credentials",
      });
      expect(getPrismaMocks().prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "user@example.com",
        },
        select: {
          isActive: true,
        },
      });
      expect(authHandler.api.signInEmail).not.toHaveBeenCalled();
    });

    it("Email not verified を email_not_verified に変換する", async () => {
      authHandler.api.signInEmail.mockRejectedValue({
        message: "Email not verified",
      });

      const result = await service.signIn({
        email: "user@example.com",
        password: "Password123!",
      });

      expect(result).toEqual({
        success: false,
        reason: "email_not_verified",
      });
    });

    it("それ以外の signIn 失敗を invalid_credentials に変換する", async () => {
      authHandler.api.signInEmail.mockRejectedValue({
        message: "Invalid credentials",
      });

      const result = await service.signIn({
        email: "user@example.com",
        password: "Password123!",
      });

      expect(result).toEqual({
        success: false,
        reason: "invalid_credentials",
      });
    });
  });

  describe("signUp", () => {
    it("メール認証 ON で Better Auth に期待値を渡し、requiresEmailVerification=true を返す", async () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "true";
      authHandler.api.signUpEmail.mockResolvedValue({
        user: { id: "user-1" },
        token: null,
      });

      const result = await service.signUp({
        email: "user@example.com",
        password: "Password123!",
        confirm_password: "Password123!",
        name: "Alice",
      });

      expect(authHandler.api.signUpEmail).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        body: {
          email: "user@example.com",
          password: "Password123!",
          name: "Alice",
          permissions: [],
          isActive: true,
          language: "",
        },
      });
      expect(getPrismaMocks().prisma.user.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        requiresEmailVerification: true,
      });
    });

    it("メール認証 OFF で emailVerified=true を補正する", async () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "false";
      authHandler.api.signUpEmail.mockResolvedValue({
        user: { id: "user-2" },
        token: "session-token",
      });

      const result = await service.signUp({
        email: "user@example.com",
        password: "Password123!",
        confirm_password: "Password123!",
        name: "Alice",
      });

      expect(getPrismaMocks().prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-2" },
        data: { emailVerified: true },
      });
      expect(result).toEqual({
        success: true,
        requiresEmailVerification: false,
      });
    });
  });

  describe("verifyEmail", () => {
    it("メール認証無効時に即座に 400 を返す", async () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "false";

      const result = await service.verifyEmail("token-1");

      expect(result).toEqual({
        success: false,
        message: "Auth.email_verification_not_enabled",
        code: 400,
      });
      expect(authHandler.api.verifyEmail).not.toHaveBeenCalled();
    });

    it.each(["invalid_token", "token_expired"])(
      "%s を invalid_or_expired_token に変換する",
      async (message) => {
        process.env.ENABLE_EMAIL_VERIFICATION = "true";
        authHandler.api.verifyEmail.mockRejectedValue({ message });

        const result = await service.verifyEmail("token-2");

        expect(result).toEqual({
          success: false,
          message: "Auth.invalid_or_expired_token",
          code: 400,
        });
      }
    );
  });

  describe("resendVerificationEmail", () => {
    it("Email is already verified を専用メッセージへ変換する", async () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "true";
      authHandler.api.sendVerificationEmail.mockRejectedValue({
        message: "Email is already verified",
      });

      const result = await service.resendVerificationEmail("user@example.com");

      expect(authHandler.api.sendVerificationEmail).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        body: {
          email: "user@example.com",
          callbackURL: "http://localhost:3000/signin",
        },
      });
      expect(result).toEqual({
        success: false,
        message: "Auth.email_already_verified",
        code: 400,
      });
    });
  });

  describe("forgotPassword / resetPassword", () => {
    it("forgotPassword が requestPasswordReset を呼ぶ", async () => {
      await service.forgotPassword({
        email: "user@example.com",
      });

      expect(authHandler.api.requestPasswordReset).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        body: {
          email: "user@example.com",
        },
      });
    });

    it("resetPassword が token と newPassword を Better Auth に渡す", async () => {
      await service.resetPassword({
        token: "reset-token",
        password: "Password123!",
        confirm_password: "Password123!",
      });

      expect(authHandler.api.resetPassword).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        body: {
          token: "reset-token",
          newPassword: "Password123!",
        },
      });
    });
  });

  describe("updateProfile", () => {
    it("名前だけ変更された場合は updateUser を呼ぶ", async () => {
      getPrismaMocks().prisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Before",
      });

      await service.updateProfile("user-1", {
        email: "user@example.com",
        name: "After",
      });

      expect(authHandler.api.updateUser).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        body: {
          name: "After",
        },
      });
      expect(authHandler.api.changeEmail).not.toHaveBeenCalled();
      expect(getPrismaMocks().prisma.user.update).not.toHaveBeenCalled();
    });

    it("メール変更 + メール認証 ON の場合は changeEmail を呼ぶ", async () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "true";
      getPrismaMocks().prisma.user.findUnique.mockResolvedValue({
        email: "before@example.com",
        name: "User",
      });

      await service.updateProfile("user-1", {
        email: "after@example.com",
        name: "User",
      });

      expect(authHandler.api.changeEmail).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        body: {
          newEmail: "after@example.com",
          callbackURL: "http://localhost:3000/settings",
        },
      });
      expect(getPrismaMocks().prisma.user.update).not.toHaveBeenCalled();
    });

    it("メール変更 + メール認証 OFF の場合は Prisma で小文字化して更新する", async () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "false";
      getPrismaMocks().prisma.user.findUnique.mockResolvedValue({
        email: "before@example.com",
        name: "User",
      });

      await service.updateProfile("user-1", {
        email: "AFTER@example.com",
        name: "User",
      });

      expect(getPrismaMocks().prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          email: "after@example.com",
          emailVerified: true,
        },
      });
      expect(authHandler.api.changeEmail).not.toHaveBeenCalled();
    });

    it("変更がなければ updateUser も changeEmail も呼ばない", async () => {
      getPrismaMocks().prisma.user.findUnique.mockResolvedValue({
        email: "same@example.com",
        name: "Same",
      });

      await service.updateProfile("user-1", {
        email: "same@example.com",
        name: "Same",
      });

      expect(authHandler.api.updateUser).not.toHaveBeenCalled();
      expect(authHandler.api.changeEmail).not.toHaveBeenCalled();
      expect(getPrismaMocks().prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("Invalid password を invalid_current_password に変換し、revokeOtherSessions を付ける", async () => {
      authHandler.api.changePassword.mockRejectedValue({
        message: "Invalid password",
      });

      await expect(
        service.changePassword("user-1", "wrong-password", "Password123!")
      ).rejects.toThrow("invalid_current_password");

      expect(authHandler.api.changePassword).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        body: {
          currentPassword: "wrong-password",
          newPassword: "Password123!",
          revokeOtherSessions: true,
        },
      });
    });
  });

  describe("createUser", () => {
    it("users と accounts を transaction 内で作成し、accounts.password にハッシュを保存する", async () => {
      const tx = {
        user: {
          create: jest.fn().mockResolvedValue({
            id: "user-10",
            email: "admin@example.com",
            name: "Admin",
            permissions: ["admin"],
            avatarKey: "avatar-key",
            isActive: true,
            emailVerified: true,
            language: "",
          }),
        },
        account: {
          create: jest.fn().mockResolvedValue(undefined),
        },
      };

      getPrismaMocks().prisma.$transaction.mockImplementation(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx)
      );

      const result = await service.createUser({
        email: "ADMIN@example.com",
        password: "Password123!",
        name: "Admin",
        permissions: ["admin"],
        avatarKey: "avatar-key",
      });

      expect(getHashMocks().hashPassword).toHaveBeenCalledWith("Password123!");
      expect(tx.user.create).toHaveBeenCalledWith({
        data: {
          email: "admin@example.com",
          name: "Admin",
          permissions: ["admin"],
          avatarKey: "avatar-key",
          language: "",
          isActive: true,
          emailVerified: true,
        },
      });
      expect(tx.account.create).toHaveBeenCalledWith({
        data: {
          userId: "user-10",
          providerId: "credential",
          accountId: "user-10",
          password: "hashed-password",
        },
      });
      expect(result).toEqual({
        id: "user-10",
        email: "admin@example.com",
        name: "Admin",
        permissions: ["admin"],
        avatarKey: "avatar-key",
        isActive: true,
        emailVerified: true,
        language: "",
      });
    });
  });

  describe("updateUser", () => {
    it("password ありのときだけ accounts を upsert する", async () => {
      const tx = {
        user: {
          update: jest.fn().mockResolvedValue({
            id: "user-20",
            email: "editor@example.com",
            name: "Editor",
            permissions: ["editor"],
            avatarKey: undefined,
            isActive: true,
            emailVerified: true,
            language: "",
          }),
        },
        account: {
          upsert: jest.fn().mockResolvedValue(undefined),
        },
      };

      getPrismaMocks().prisma.$transaction.mockImplementation(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx)
      );

      await service.updateUser("user-20", {
        email: "EDITOR@example.com",
        password: "Password123!",
        name: "Editor",
        permissions: ["editor"],
        avatarKey: undefined,
      });

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "user-20" },
        data: {
          email: "editor@example.com",
          name: "Editor",
          permissions: ["editor"],
          avatarKey: undefined,
        },
      });
      expect(tx.account.upsert).toHaveBeenCalledWith({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: "user-20",
          },
        },
        update: {
          userId: "user-20",
          password: "hashed-password",
        },
        create: {
          userId: "user-20",
          providerId: "credential",
          accountId: "user-20",
          password: "hashed-password",
        },
      });
    });

    it("空 password のときは account を触らない", async () => {
      const tx = {
        user: {
          update: jest.fn().mockResolvedValue({
            id: "user-21",
            email: "viewer@example.com",
            name: "Viewer",
            permissions: ["viewer"],
            avatarKey: undefined,
            isActive: true,
            emailVerified: true,
            language: "",
          }),
        },
        account: {
          upsert: jest.fn().mockResolvedValue(undefined),
        },
      };

      getPrismaMocks().prisma.$transaction.mockImplementation(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx)
      );

      await service.updateUser("user-21", {
        email: "VIEWER@example.com",
        password: "",
        name: "Viewer",
        permissions: ["viewer"],
        avatarKey: undefined,
      });

      expect(getHashMocks().hashPassword).not.toHaveBeenCalled();
      expect(tx.account.upsert).not.toHaveBeenCalled();
    });
  });
});
