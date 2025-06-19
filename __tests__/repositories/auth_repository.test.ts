import { AuthRepository } from "@/repositories/auth_repository";
import { AuthSchema, Auth } from "@/models/auth";
import { SignInRequest } from "@/requests/signin_request";
import { SignUpRequest } from "@/requests/signup_request";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { hashPassword, verifyPassword, generateToken } from "@/libraries/hash";
import { z } from "zod";

// Mock the hash functions
jest.mock("@/libraries/hash", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
}));

// Create a concrete implementation for testing
class TestAuthRepository extends AuthRepository {
  private mockData: Auth[] = [];

  constructor() {
    super(AuthSchema, "user", (data) => data, ["name", "email"]);
  }

  // Override PrismaRepository methods for testing
  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: any[]
  ): Promise<{ data: Auth[]; count: number }> {
    let filteredData = [...this.mockData];

    // Apply conditions filter
    if (conditions && conditions.length > 0) {
      filteredData = filteredData.filter((item) =>
        conditions.every((condition) => {
          const value = item[condition.column as keyof Auth];
          switch (condition.operator) {
            case "=":
            default:
              return value === condition.value;
          }
        })
      );
    }

    return {
      data: filteredData.slice(offset, offset + limit),
      count: filteredData.length,
    };
  }

  async findById(id: string): Promise<Auth> {
    const item = this.mockData.find((item) => item.id === id);
    if (!item) {
      throw new Error(`User with id ${id} not found`);
    }
    return item;
  }

  async create(item: Omit<Auth, "id">): Promise<Auth> {
    const newItem: Auth = {
      ...item,
      id: String(this.mockData.length + 1),
    };
    this.mockData.push(newItem);
    return newItem;
  }

  async update(id: string, item: Partial<Auth>): Promise<Auth> {
    const index = this.mockData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    this.mockData[index] = { ...this.mockData[index], ...item };
    return this.mockData[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.mockData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    this.mockData.splice(index, 1);
  }

  // Helper method to add mock data
  addMockUser(user: Auth): void {
    this.mockData.push(user);
  }

  clearMockData(): void {
    this.mockData = [];
  }
}

describe("AuthRepository", () => {
  let repository: TestAuthRepository;
  let mockHashPassword: jest.MockedFunction<typeof hashPassword>;
  let mockVerifyPassword: jest.MockedFunction<typeof verifyPassword>;
  let mockGenerateToken: jest.MockedFunction<typeof generateToken>;

  beforeEach(() => {
    repository = new TestAuthRepository();
    mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
    mockVerifyPassword = verifyPassword as jest.MockedFunction<
      typeof verifyPassword
    >;
    mockGenerateToken = generateToken as jest.MockedFunction<
      typeof generateToken
    >;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("postSignIn", () => {
    it("should authenticate user with valid credentials", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: ["read", "write"],
      };
      repository.addMockUser(user);

      const request: SignInRequest = {
        email: "test@example.com",
        password: "plainPassword",
      };

      mockVerifyPassword.mockResolvedValue(true);
      mockGenerateToken.mockResolvedValue("generated-token");

      const result = await repository.postSignIn(request);

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

      await expect(repository.postSignIn(request)).rejects.toThrow(
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
      repository.addMockUser(user);

      const request: SignInRequest = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      mockVerifyPassword.mockResolvedValue(false);

      await expect(repository.postSignIn(request)).rejects.toThrow(
        "Invalid credentials"
      );
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        "wrongPassword",
        "hashedPassword"
      );
    });
  });

  describe("postSignUp", () => {
    it("should create new user successfully", async () => {
      const request: SignUpRequest = {
        email: "new@example.com",
        password: "newPassword",
        confirm_password: "newPassword",
        name: "New User",
      };

      mockHashPassword.mockResolvedValue("hashedNewPassword");
      mockGenerateToken.mockResolvedValue("new-token");

      const result = await repository.postSignUp(request);

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(mockGenerateToken).toHaveBeenCalled();
      expect(result).toEqual({
        id: "1",
        access_token: "new-token",
        token_type: "Bearer",
        expires_in: 3600,
        permissions: [],
      });

      // Verify user was created
      const users = await repository.get();
      expect(users.count).toBe(1);
      expect(users.data[0].email).toBe("new@example.com");
    });

    it("should throw error when user already exists", async () => {
      const existingUser: Auth = {
        id: "user-1",
        email: "existing@example.com",
        password: "hashedPassword",
        name: "Existing User",
        permissions: [],
      };
      repository.addMockUser(existingUser);

      const request: SignUpRequest = {
        email: "existing@example.com",
        password: "password",
        confirm_password: "password",
        name: "Duplicate User",
      };

      await expect(repository.postSignUp(request)).rejects.toThrow(
        "User already exists"
      );
    });
  });

  describe("postForgotPassword", () => {
    it("should return success message regardless of email existence", async () => {
      const request: ForgotPasswordRequest = {
        email: "any@example.com",
      };

      const result = await repository.postForgotPassword(request);

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
      repository.addMockUser(user);

      const request: ForgotPasswordRequest = {
        email: "existing@example.com",
      };

      const result = await repository.postForgotPassword(request);

      expect(result).toEqual({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        code: 200,
      });
    });
  });

  describe("postResetPassword", () => {
    it("should reset password for existing user", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "oldHashedPassword",
        name: "Test User",
        permissions: [],
      };
      repository.addMockUser(user);

      const request: ResetPasswordRequest = {
        email: "test@example.com",
        password: "newPassword",
        confirm_password: "newPassword",
        token: "reset-token",
      };

      mockHashPassword.mockResolvedValue("newHashedPassword");

      const result = await repository.postResetPassword(request);

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(result).toEqual({
        success: true,
        message: "Password has been reset successfully.",
        code: 200,
      });

      // Verify password was updated
      const updatedUser = await repository.findById("user-1");
      expect(updatedUser.password).toBe("newHashedPassword");
    });

    it("should throw error for non-existent user", async () => {
      const request: ResetPasswordRequest = {
        email: "nonexistent@example.com",
        password: "newPassword",
        confirm_password: "newPassword",
        token: "reset-token",
      };

      await expect(repository.postResetPassword(request)).rejects.toThrow(
        "Invalid reset token"
      );
    });
  });

  describe("updateUserPassword", () => {
    it("should update user password", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "oldPassword",
        name: "Test User",
        permissions: [],
      };
      repository.addMockUser(user);

      mockHashPassword.mockResolvedValue("newHashedPassword");

      await repository.updateUserPassword("user-1", "newPassword");

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");

      const updatedUser = await repository.findById("user-1");
      expect(updatedUser.password).toBe("newHashedPassword");
    });

    it("should not update password when password is empty", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword",
        name: "Test User",
        permissions: [],
      };
      repository.addMockUser(user);

      await repository.updateUserPassword("user-1", "");

      expect(mockHashPassword).not.toHaveBeenCalled();

      const unchangedUser = await repository.findById("user-1");
      expect(unchangedUser.password).toBe("originalPassword");
    });

    it("should not update password when password is whitespace", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword",
        name: "Test User",
        permissions: [],
      };
      repository.addMockUser(user);

      await repository.updateUserPassword("user-1", "   ");

      expect(mockHashPassword).not.toHaveBeenCalled();

      const unchangedUser = await repository.findById("user-1");
      expect(unchangedUser.password).toBe("originalPassword");
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

      mockHashPassword.mockResolvedValue("hashedPassword");

      const result = await repository.createUserWithHashedPassword(userData);

      expect(mockHashPassword).toHaveBeenCalledWith("plainPassword");
      expect(result).toEqual({
        id: "1",
        email: "new@example.com",
        name: "New User",
        permissions: ["read"],
        password: "hashedPassword",
      });
    });
  });

  describe("updateUserData", () => {
    it("should update user data with hashed password", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "oldPassword",
        name: "Old Name",
        permissions: [],
      };
      repository.addMockUser(user);

      const updateData = {
        name: "New Name",
        password: "newPassword",
        permissions: ["read", "write"],
      };

      mockHashPassword.mockResolvedValue("newHashedPassword");

      const result = await repository.updateUserData("user-1", updateData);

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword");
      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        password: "newHashedPassword",
        name: "New Name",
        permissions: ["read", "write"],
      });
    });

    it("should update user data without password change when password is empty", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword",
        name: "Old Name",
        permissions: [],
      };
      repository.addMockUser(user);

      const updateData = {
        name: "New Name",
        password: "",
        permissions: ["read"],
      };

      const result = await repository.updateUserData("user-1", updateData);

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword", // Password unchanged
        name: "New Name",
        permissions: ["read"],
      });
    });

    it("should update user data without password field when not provided", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword",
        name: "Old Name",
        permissions: [],
      };
      repository.addMockUser(user);

      const updateData = {
        name: "New Name",
        permissions: ["admin"],
      };

      const result = await repository.updateUserData("user-1", updateData);

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        password: "originalPassword", // Password unchanged
        name: "New Name",
        permissions: ["admin"],
      });
    });
  });
});
