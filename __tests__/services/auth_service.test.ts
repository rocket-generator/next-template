import { AuthService } from "@/services/auth_service";
import { AuthRepositoryInterface } from "@/repositories/auth_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
import { Auth } from "@/models/auth";
import { PasswordReset } from "@/models/password_reset";
import { EmailVerification } from "@/models/email_verification";
import { SignInRequest } from "@/requests/signin_request";
import { SignUpRequest } from "@/requests/signup_request";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { hashPassword, verifyPassword, generateToken } from "@/libraries/hash";
import {
  generateResetToken,
  createTokenExpiry,
  isTokenExpired,
  getCurrentTimestamp,
} from "@/libraries/reset_token";
import { createEmailServiceInstance } from "@/libraries/email";

// Mock dependencies
jest.mock("@/libraries/hash");
jest.mock("@/libraries/reset_token");
jest.mock("@/libraries/email");
jest.mock("next-intl/server");

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
const mockGenerateResetToken = generateResetToken as jest.MockedFunction<typeof generateResetToken>;
const mockCreateTokenExpiry = createTokenExpiry as jest.MockedFunction<typeof createTokenExpiry>;
const mockIsTokenExpired = isTokenExpired as jest.MockedFunction<typeof isTokenExpired>;
const mockGetCurrentTimestamp = getCurrentTimestamp as jest.MockedFunction<typeof getCurrentTimestamp>;
const mockCreateEmailServiceInstance = createEmailServiceInstance as jest.MockedFunction<typeof createEmailServiceInstance>;

describe("AuthService", () => {
  let authService: AuthService;
  let mockAuthRepository: jest.Mocked<AuthRepositoryInterface>;
  let mockPasswordResetRepository: jest.Mocked<PasswordResetRepository>;
  let mockEmailVerificationRepository: jest.Mocked<EmailVerificationRepository>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    delete process.env.ENABLE_EMAIL_VERIFICATION;

    // Create mock repositories
    mockAuthRepository = {
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockPasswordResetRepository = {
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteUserTokens: jest.fn(),
      findByToken: jest.fn(),
    } as any;

    mockEmailVerificationRepository = {
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteUserTokens: jest.fn(),
      findByToken: jest.fn(),
    } as any;

    // Create AuthService instance
    authService = new AuthService(
      mockAuthRepository,
      mockPasswordResetRepository,
      mockEmailVerificationRepository
    );

    // Setup default mock implementations
    mockHashPassword.mockResolvedValue("hashedPassword");
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateToken.mockResolvedValue("accessToken");
    mockGenerateResetToken.mockResolvedValue("resetToken");
    mockCreateTokenExpiry.mockReturnValue(BigInt(Date.now() + 24 * 60 * 60 * 1000));
    mockIsTokenExpired.mockReturnValue(false);
    mockGetCurrentTimestamp.mockReturnValue(BigInt(Date.now()));
    mockCreateEmailServiceInstance.mockReturnValue({
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    } as any);
  });

  describe("signIn", () => {
    it("should sign in user with valid credentials", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: [],
        emailVerified: true,
        isActive: true,
      };

      const request: SignInRequest = {
        email: "test@example.com",
        password: "password123",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [user],
        count: 1,
      });
      mockVerifyPassword.mockResolvedValue(true);

      const result = await authService.signIn(request);

      expect(mockAuthRepository.get).toHaveBeenCalledWith(
        0,
        1,
        undefined,
        undefined,
        undefined,
        [{ column: "email", operator: "=", value: "test@example.com" }]
      );
      expect(mockVerifyPassword).toHaveBeenCalledWith("password123", "hashedPassword");
      expect(result).toEqual({
        id: "user-1",
        access_token: "accessToken",
        token_type: "Bearer",
        expires_in: 3600,
        permissions: [],
      });
    });

    it("should throw error for invalid credentials", async () => {
      const request: SignInRequest = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [],
        count: 0,
      });

      await expect(authService.signIn(request)).rejects.toThrow("Invalid credentials");
    });

    it("should throw error for unverified email when verification is enabled", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: [],
        emailVerified: false,
        isActive: true,
      };

      const request: SignInRequest = {
        email: "test@example.com",
        password: "password123",
      };

      // Enable email verification
      process.env.ENABLE_EMAIL_VERIFICATION = "true";

      mockAuthRepository.get.mockResolvedValue({
        data: [user],
        count: 1,
      });
      mockVerifyPassword.mockResolvedValue(true);

      await expect(authService.signIn(request)).rejects.toThrow(
        "Email not verified. Please check your email and verify your account."
      );

      // Clean up
      delete process.env.ENABLE_EMAIL_VERIFICATION;
    });
  });

  describe("signUp", () => {
    it("should sign up new user successfully", async () => {
      const request: SignUpRequest = {
        email: "new@example.com",
        password: "password123",
        confirm_password: "password123",
        name: "New User",
      };

      const createdUser: Auth = {
        id: "user-1",
        email: "new@example.com",
        password: "hashedPassword",
        name: "New User",
        permissions: [],
        emailVerified: true,
        isActive: true,
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [],
        count: 0,
      });
      mockAuthRepository.create.mockResolvedValue(createdUser);

      const result = await authService.signUp(request);

      expect(mockAuthRepository.get).toHaveBeenCalledWith(
        0,
        1,
        undefined,
        undefined,
        undefined,
        [{ column: "email", operator: "=", value: "new@example.com" }]
      );
      expect(mockHashPassword).toHaveBeenCalledWith("password123");
      expect(mockAuthRepository.create).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "hashedPassword",
        name: "New User",
        permissions: [],
        emailVerified: true,
        isActive: true,
      });
      expect(result).toEqual({
        id: "user-1",
        access_token: "accessToken",
        token_type: "Bearer",
        expires_in: 3600,
        permissions: [],
      });
    });

    it("should throw error for existing user", async () => {
      const request: SignUpRequest = {
        email: "existing@example.com",
        password: "password123",
        confirm_password: "password123",
        name: "Existing User",
      };

      const existingUser: Auth = {
        id: "user-1",
        email: "existing@example.com",
        password: "hashedPassword",
        name: "Existing User",
        permissions: [],
        emailVerified: true,
        isActive: true,
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [existingUser],
        count: 1,
      });

      await expect(authService.signUp(request)).rejects.toThrow("User already exists");
    });
  });

  describe("forgotPassword", () => {
    it("should send password reset email for existing user", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: [],
        emailVerified: true,
        isActive: true,
      };

      const request: ForgotPasswordRequest = {
        email: "test@example.com",
      };

      const resetToken: PasswordReset = {
        id: "token-1",
        userId: "user-1",
        token: "reset-token",
        expiresAt: BigInt(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.get.mockResolvedValue({
        data: [user],
        count: 1,
      });
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
        emailVerified: true,
        isActive: true,
      };

      const resetToken: PasswordReset = {
        id: "token-1",
        userId: "user-1",
        token: "reset-token",
        expiresAt: BigInt(Date.now() + 3600000), // 1 hour from now
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
        usedAt: BigInt(Date.now()),
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
        isActive: true,
        emailVerified: true,
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
        isActive: true,
        emailVerified: false,
      };

      const createdUser: Auth = {
        id: "user-1",
        email: "new@example.com",
        name: "New User",
        permissions: ["read"],
        password: "hashedPassword",
        isActive: true,
        emailVerified: false,
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
        isActive: true,
        emailVerified: true,
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
        isActive: true,
        emailVerified: true,
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
        isActive: true,
        emailVerified: true,
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
        emailVerified: true,
        isActive: true,
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
        emailVerified: true,
        isActive: true,
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

  describe("sendVerificationEmail", () => {
    beforeEach(() => {
      process.env.ENABLE_EMAIL_VERIFICATION = "true";
    });

    afterEach(() => {
      delete process.env.ENABLE_EMAIL_VERIFICATION;
    });

    it("should send verification email for user", async () => {
      const userId = "user-1";
      const user: Auth = {
        id: userId,
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: [],
        emailVerified: false,
        isActive: true,
      };

      const mockExpiresAt = BigInt(Date.now() + 24 * 60 * 60 * 1000);
      const mockVerificationRecord: EmailVerification = {
        id: "verification-1",
        userId,
        token: "verification-token",
        expiresAt: mockExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGenerateResetToken.mockResolvedValue("verification-token");
      mockCreateTokenExpiry.mockReturnValue(mockExpiresAt);
      mockEmailVerificationRepository.deleteUserTokens.mockResolvedValue();
      mockEmailVerificationRepository.create.mockResolvedValue(mockVerificationRecord);

      await authService.sendVerificationEmail(userId, user.email);

      expect(mockGenerateResetToken).toHaveBeenCalled();
      expect(mockCreateTokenExpiry).toHaveBeenCalled();
      expect(mockEmailVerificationRepository.deleteUserTokens).toHaveBeenCalledWith(userId);
      expect(mockEmailVerificationRepository.create).toHaveBeenCalledWith({
        userId,
        token: "verification-token",
        expiresAt: mockExpiresAt,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should throw error if verification token creation fails", async () => {
      const userId = "user-1";
      const email = "test@example.com";

      mockEmailVerificationRepository.deleteUserTokens.mockResolvedValue();
      mockGenerateResetToken.mockRejectedValue(new Error("Token generation failed"));

      await expect(authService.sendVerificationEmail(userId, email)).rejects.toThrow(
        "Failed to send verification email"
      );

      expect(mockEmailVerificationRepository.deleteUserTokens).toHaveBeenCalledWith(userId);
      expect(mockEmailVerificationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("verifyEmailToken", () => {
    beforeEach(() => {
      process.env.ENABLE_EMAIL_VERIFICATION = "true";
    });

    afterEach(() => {
      delete process.env.ENABLE_EMAIL_VERIFICATION;
    });

    it("should verify email token and activate user", async () => {
      const token = "verification-token";
      const userId = "user-1";
      const verificationRecord: EmailVerification = {
        id: "verification-1",
        userId,
        token,
        expiresAt: BigInt(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEmailVerificationRepository.findByToken.mockResolvedValue(verificationRecord);
      mockIsTokenExpired.mockReturnValue(false);
      mockAuthRepository.update.mockResolvedValue({} as any);
      mockEmailVerificationRepository.deleteUserTokens.mockResolvedValue();

      const result = await authService.verifyEmailToken(token);

      expect(result).toBe(true);
      expect(mockEmailVerificationRepository.findByToken).toHaveBeenCalledWith(token);
      expect(mockAuthRepository.update).toHaveBeenCalledWith(userId, {
        emailVerified: true,
      });
      expect(mockEmailVerificationRepository.deleteUserTokens).toHaveBeenCalledWith(userId);
    });

    it("should return false for invalid token", async () => {
      const token = "invalid-token";

      mockEmailVerificationRepository.findByToken.mockResolvedValue(null);

      const result = await authService.verifyEmailToken(token);

      expect(result).toBe(false);
      expect(mockEmailVerificationRepository.findByToken).toHaveBeenCalledWith(token);
      expect(mockAuthRepository.update).not.toHaveBeenCalled();
      expect(mockEmailVerificationRepository.deleteUserTokens).not.toHaveBeenCalled();
    });

    it("should return false for expired token", async () => {
      const token = "expired-token";
      const userId = "user-1";
      const verificationRecord: EmailVerification = {
        id: "verification-1",
        userId,
        token,
        expiresAt: BigInt(Date.now() - 3600000), // 1 hour ago
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEmailVerificationRepository.findByToken.mockResolvedValue(verificationRecord);
      mockIsTokenExpired.mockReturnValue(true);

      const result = await authService.verifyEmailToken(token);

      expect(result).toBe(false);
      expect(mockIsTokenExpired).toHaveBeenCalledWith(verificationRecord.expiresAt);
    });
  });
}); 
