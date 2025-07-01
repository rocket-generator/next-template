import { AuthService } from "@/services/auth_service";
import { AuthRepositoryInterface } from "@/repositories/auth_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { SignInRequest } from "@/requests/signin_request";
import { SignUpRequest } from "@/requests/signup_request";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { hashPassword, verifyPassword, generateToken } from "@/libraries/hash";
import { Auth } from "@/models/auth";
import { PasswordReset } from "@/models/password_reset";
import { z } from "zod";

// Mock the hash functions
jest.mock("@/libraries/hash", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
}));

// Mock email service
jest.mock("@/libraries/email", () => ({
  createEmailServiceInstance: jest.fn(() => ({
    sendPasswordResetEmail: jest.fn(),
  })),
}));

// Mock reset token functions
jest.mock("@/libraries/reset_token", () => ({
  generateResetToken: jest.fn(),
  createTokenExpiry: jest.fn(),
  isTokenExpired: jest.fn(),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let mockAuthRepository: jest.Mocked<AuthRepositoryInterface>;
  let mockPasswordResetRepository: jest.Mocked<PasswordResetRepository>;
  let mockHashPassword: jest.MockedFunction<typeof hashPassword>;
  let mockVerifyPassword: jest.MockedFunction<typeof verifyPassword>;
  let mockGenerateToken: jest.MockedFunction<typeof generateToken>;

  beforeEach(() => {
    // Create mock repositories
    mockAuthRepository = {
      get: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getMe: jest.fn(),
    };

    mockPasswordResetRepository = {
      get: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteUserTokens: jest.fn(),
    } as jest.Mocked<PasswordResetRepository>;

    authService = new AuthService(mockAuthRepository, mockPasswordResetRepository);

    // Setup mocks
    mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
    mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
    mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("signIn", () => {
    it("should authenticate user with valid credentials", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: ["read", "write"],
      };

      const request: SignInRequest = {
        email: "test@example.com",
        password: "plainPassword",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [user],
        count: 1,
      });
      mockVerifyPassword.mockResolvedValue(true);
      mockGenerateToken.mockResolvedValue("generated-token");

      const result = await authService.signIn(request);

      expect(mockAuthRepository.get).toHaveBeenCalledWith(
        0,
        1,
        undefined,
        undefined,
        undefined,
        [{ column: "email", operator: "=", value: request.email }]
      );
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        "plainPassword",
        "hashedPassword"
      );
      expect(mockGenerateToken).toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-1",
        access_token: "generated-token",
        token_type: "Bearer",
        expires_in: 3600,
        permissions: ["read", "write"],
      });
    });

    it("should throw error for non-existent user", async () => {
      const request: SignInRequest = {
        email: "nonexistent@example.com",
        password: "password",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [],
        count: 0,
      });

      await expect(authService.signIn(request)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw error for invalid password", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: ["read"],
      };

      const request: SignInRequest = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [user],
        count: 1,
      });
      mockVerifyPassword.mockResolvedValue(false);

      await expect(authService.signIn(request)).rejects.toThrow(
        "Invalid credentials"
      );
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        "wrongPassword",
        "hashedPassword"
      );
    });
  });

  describe("signUp", () => {
    it("should create new user successfully", async () => {
      const request: SignUpRequest = {
        email: "new@example.com",
        password: "newPassword",
        confirm_password: "newPassword",
        name: "New User",
      };

      const newUser: Auth = {
        id: "user-1",
        email: "new@example.com",
        password: "hashedNewPassword",
        name: "New User",
        permissions: [],
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [],
        count: 0,
      });
      mockHashPassword.mockResolvedValue("hashedNewPassword");
      mockAuthRepository.create.mockResolvedValue(newUser);
      mockGenerateToken.mockResolvedValue("new-token");

      const result = await authService.signUp(request);

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(mockAuthRepository.create).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "hashedNewPassword",
        name: "New User",
        permissions: [],
      });
      expect(mockGenerateToken).toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-1",
        access_token: "new-token",
        token_type: "Bearer",
        expires_in: 3600,
        permissions: [],
      });
    });

    it("should throw error when user already exists", async () => {
      const existingUser: Auth = {
        id: "user-1",
        email: "existing@example.com",
        password: "hashedPassword",
        name: "Existing User",
        permissions: [],
      };

      const request: SignUpRequest = {
        email: "existing@example.com",
        password: "password",
        confirm_password: "password",
        name: "Duplicate User",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [existingUser],
        count: 1,
      });

      await expect(authService.signUp(request)).rejects.toThrow(
        "User already exists"
      );
    });
  });

  describe("forgotPassword", () => {
    it("should return success message regardless of email existence", async () => {
      const request: ForgotPasswordRequest = {
        email: "any@example.com",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [],
        count: 0,
      });

      const result = await authService.forgotPassword(request);

      expect(result).toEqual({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        code: 200,
      });
    });

    it("should return same message for existing user", async () => {
      const user: Auth = {
        id: "user-1",
        email: "existing@example.com",
        password: "hashedPassword",
        name: "Existing User",
        permissions: [],
      };

      const request: ForgotPasswordRequest = {
        email: "existing@example.com",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [user],
        count: 1,
      });

      const resetToken: PasswordReset = {
        id: "token-1",
        userId: "user-1",
        token: "reset-token",
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPasswordResetRepository.deleteUserTokens.mockResolvedValue();
      jest.spyOn(authService, 'createResetToken').mockResolvedValue(resetToken);

      const result = await authService.forgotPassword(request);

      expect(result).toEqual({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        code: 200,
      });
    });
  });

  describe("resetPassword", () => {
    it("should reset password for existing user", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "oldHashedPassword",
        name: "Test User",
        permissions: [],
      };

      const resetToken: PasswordReset = {
        id: "token-1",
        userId: "user-1",
        token: "reset-token",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const request: ResetPasswordRequest = {
        email: "test@example.com",
        password: "newPassword",
        confirm_password: "newPassword",
        token: "reset-token",
      };

      jest.spyOn(authService, 'findValidResetToken').mockResolvedValue(resetToken);
      mockAuthRepository.findById.mockResolvedValue(user);
      mockHashPassword.mockResolvedValue("newHashedPassword");
      mockAuthRepository.update.mockResolvedValue({
        ...user,
        password: "newHashedPassword",
      });
      mockPasswordResetRepository.update.mockResolvedValue({
        ...resetToken,
        usedAt: new Date(),
      });
      mockPasswordResetRepository.deleteUserTokens.mockResolvedValue();

      const result = await authService.resetPassword(request);

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(mockAuthRepository.update).toHaveBeenCalledWith(user.id, {
        password: "newHashedPassword",
      });
      expect(result).toEqual({
        success: true,
        message: "Password has been reset successfully.",
        code: 200,
      });
    });

    it("should throw error for non-existent user", async () => {
      const request: ResetPasswordRequest = {
        email: "nonexistent@example.com",
        password: "newPassword",
        confirm_password: "newPassword",
        token: "reset-token",
      };

      jest.spyOn(authService, 'findValidResetToken').mockResolvedValue(null);

      await expect(authService.resetPassword(request)).rejects.toThrow(
        "Invalid reset token"
      );
    });
  });

  describe("updateUserPassword", () => {
    it("should update user password", async () => {
      mockHashPassword.mockResolvedValue("newHashedPassword");
      mockAuthRepository.update.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: "newHashedPassword",
        name: "Test User",
        permissions: [],
      });

      await authService.updateUserPassword("user-1", "newPassword");

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(mockAuthRepository.update).toHaveBeenCalledWith("user-1", {
        password: "newHashedPassword",
      });
    });

    it("should not update password when password is empty", async () => {
      await authService.updateUserPassword("user-1", "");

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockAuthRepository.update).not.toHaveBeenCalled();
    });

    it("should not update password when password is whitespace", async () => {
      await authService.updateUserPassword("user-1", "   ");

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockAuthRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("createUserWithHashedPassword", () => {
    it("should create user with hashed password", async () => {
      const userData = {
        email: "new@example.com",
        name: "New User",
        permissions: ["read"],
        password: "plainPassword",
      };

      const createdUser: Auth = {
        id: "user-1",
        email: "new@example.com",
        name: "New User",
        permissions: ["read"],
        password: "hashedPassword",
      };

      mockHashPassword.mockResolvedValue("hashedPassword");
      mockAuthRepository.create.mockResolvedValue(createdUser);

      const result = await authService.createUserWithHashedPassword(userData);

      expect(mockHashPassword).toHaveBeenCalledWith("plainPassword");
      expect(mockAuthRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: "hashedPassword",
      });
      expect(result).toEqual(createdUser);
    });
  });

  describe("updateUserData", () => {
    it("should update user data with hashed password", async () => {
      const updateData = {
        name: "New Name",
        password: "newPassword",
        permissions: ["read", "write"],
      };

      const updatedUser: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "newHashedPassword",
        name: "New Name",
        permissions: ["read", "write"],
      };

      mockHashPassword.mockResolvedValue("newHashedPassword");
      mockAuthRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUserData("user-1", updateData);

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(mockAuthRepository.update).toHaveBeenCalledWith("user-1", {
        name: "New Name",
        password: "newHashedPassword",
        permissions: ["read", "write"],
      });
      expect(result).toEqual(updatedUser);
    });

    it("should update user data without password change when password is empty", async () => {
      const updateData = {
        name: "New Name",
        password: "",
        permissions: ["read"],
      };

      const updatedUser: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword",
        name: "New Name",
        permissions: ["read"],
      };

      mockAuthRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUserData("user-1", updateData);

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockAuthRepository.update).toHaveBeenCalledWith("user-1", {
        name: "New Name",
        permissions: ["read"],
      });
      expect(result).toEqual(updatedUser);
    });

    it("should update user data without password field when not provided", async () => {
      const updateData = {
        name: "New Name",
        permissions: ["admin"],
      };

      const updatedUser: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword",
        name: "New Name",
        permissions: ["admin"],
      };

      mockAuthRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUserData("user-1", updateData);

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockAuthRepository.update).toHaveBeenCalledWith("user-1", {
        name: "New Name",
        permissions: ["admin"],
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe("changePassword", () => {
    it("should change password when current password is valid", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "currentHashedPassword",
        name: "Test User",
        permissions: [],
      };

      const updatedUser: Auth = {
        ...user,
        password: "newHashedPassword",
      };

      mockAuthRepository.findById.mockResolvedValue(user);
      mockVerifyPassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue("newHashedPassword");
      mockAuthRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.changePassword(
        "user-1",
        "currentPassword",
        "newPassword"
      );

      expect(mockVerifyPassword).toHaveBeenCalledWith(
        "currentPassword",
        "currentHashedPassword"
      );
      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(mockAuthRepository.update).toHaveBeenCalledWith("user-1", {
        password: "newHashedPassword",
      });
      expect(result).toEqual(updatedUser);
    });

    it("should throw error when current password is invalid", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "currentHashedPassword",
        name: "Test User",
        permissions: [],
      };

      mockAuthRepository.findById.mockResolvedValue(user);
      mockVerifyPassword.mockResolvedValue(false);

      await expect(
        authService.changePassword("user-1", "wrongPassword", "newPassword")
      ).rejects.toThrow("invalid_current_password");

      expect(mockVerifyPassword).toHaveBeenCalledWith(
        "wrongPassword",
        "currentHashedPassword"
      );
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockAuthRepository.update).not.toHaveBeenCalled();
    });
  });
}); 