import { AuthSchema, Auth } from "@/models/auth";

describe("Auth Model", () => {
  describe("AuthSchema", () => {
    it("should validate a valid auth object", () => {
      const validAuth = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedPassword123",
        name: "Test User",
        permissions: ["read", "write"],
      };

      const result = AuthSchema.parse(validAuth);
      expect(result).toEqual(validAuth);
    });

    it("should validate auth with empty permissions", () => {
      const validAuth = {
        id: "user-456",
        email: "user@example.com",
        password: "hashedPassword456",
        name: "Another User",
        permissions: [],
      };

      const result = AuthSchema.parse(validAuth);
      expect(result).toEqual(validAuth);
      expect(result.permissions).toEqual([]);
    });

    it("should validate auth with multiple permissions", () => {
      const validAuth = {
        id: "admin-789",
        email: "admin@example.com",
        password: "hashedPassword789",
        name: "Admin User",
        permissions: ["read", "write", "delete", "admin"],
      };

      const result = AuthSchema.parse(validAuth);
      expect(result.permissions).toHaveLength(4);
      expect(result.permissions).toContain("admin");
    });

    it("should fail validation when id is not string", () => {
      const invalidAuth = {
        id: 123, // Should be string
        email: "test@example.com",
        password: "password",
        name: "Test User",
        permissions: [],
      };

      expect(() => AuthSchema.parse(invalidAuth)).toThrow();
    });

    it("should fail validation when email is not string", () => {
      const invalidAuth = {
        id: "user-123",
        email: null, // Should be string
        password: "password",
        name: "Test User",
        permissions: [],
      };

      expect(() => AuthSchema.parse(invalidAuth)).toThrow();
    });

    it("should fail validation when password is not string", () => {
      const invalidAuth = {
        id: "user-123",
        email: "test@example.com",
        password: undefined, // Should be string
        name: "Test User",
        permissions: [],
      };

      expect(() => AuthSchema.parse(invalidAuth)).toThrow();
    });

    it("should fail validation when name is not string", () => {
      const invalidAuth = {
        id: "user-123",
        email: "test@example.com",
        password: "password",
        name: { first: "Test", last: "User" }, // Should be string
        permissions: [],
      };

      expect(() => AuthSchema.parse(invalidAuth)).toThrow();
    });

    it("should fail validation when permissions is not array", () => {
      const invalidAuth = {
        id: "user-123",
        email: "test@example.com",
        password: "password",
        name: "Test User",
        permissions: "read,write", // Should be array
      };

      expect(() => AuthSchema.parse(invalidAuth)).toThrow();
    });

    it("should fail validation when permissions contains non-string", () => {
      const invalidAuth = {
        id: "user-123",
        email: "test@example.com",
        password: "password",
        name: "Test User",
        permissions: ["read", 123, "write"], // Should be all strings
      };

      expect(() => AuthSchema.parse(invalidAuth)).toThrow();
    });

    it("should fail validation when required fields are missing", () => {
      const missingId = {
        email: "test@example.com",
        password: "password",
        name: "Test User",
        permissions: [],
      };

      const missingEmail = {
        id: "user-123",
        password: "password",
        name: "Test User",
        permissions: [],
      };

      const missingPassword = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        permissions: [],
      };

      const missingName = {
        id: "user-123",
        email: "test@example.com",
        password: "password",
        permissions: [],
      };

      const missingPermissions = {
        id: "user-123",
        email: "test@example.com",
        password: "password",
        name: "Test User",
      };

      expect(() => AuthSchema.parse(missingId)).toThrow();
      expect(() => AuthSchema.parse(missingEmail)).toThrow();
      expect(() => AuthSchema.parse(missingPassword)).toThrow();
      expect(() => AuthSchema.parse(missingName)).toThrow();
      expect(() => AuthSchema.parse(missingPermissions)).toThrow();
    });

    it("should handle various email formats", () => {
      const emails = [
        "simple@example.com",
        "user.name@example.com",
        "user+tag@example.co.jp",
        "user_123@sub.example.org",
      ];

      emails.forEach((email) => {
        const auth = {
          id: "user-123",
          email,
          password: "password",
          name: "Test User",
          permissions: [],
        };

        const result = AuthSchema.parse(auth);
        expect(result.email).toBe(email);
      });
    });

    it("should handle special characters in name", () => {
      const validAuth = {
        id: "user-123",
        email: "test@example.com",
        password: "password",
        name: "山田 太郎 (Yamada Taro)",
        permissions: [],
      };

      const result = AuthSchema.parse(validAuth);
      expect(result.name).toBe("山田 太郎 (Yamada Taro)");
    });

    it("should handle empty strings", () => {
      const validAuth = {
        id: "", // Empty but valid string
        email: "", // Empty but valid string
        password: "", // Empty but valid string
        name: "", // Empty but valid string
        permissions: [],
      };

      const result = AuthSchema.parse(validAuth);
      expect(result.id).toBe("");
      expect(result.email).toBe("");
      expect(result.password).toBe("");
      expect(result.name).toBe("");
    });

    it("should handle duplicate permissions", () => {
      const validAuth = {
        id: "user-123",
        email: "test@example.com",
        password: "password",
        name: "Test User",
        permissions: ["read", "write", "read", "write"], // Duplicates
      };

      const result = AuthSchema.parse(validAuth);
      expect(result.permissions).toEqual(["read", "write", "read", "write"]);
    });
  });

  describe("Auth Type", () => {
    it("should infer correct type", () => {
      const auth: Auth = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: ["read"],
      };

      // TypeScript will ensure this compiles
      expect(auth.id).toBe("user-123");
      expect(auth.email).toBe("test@example.com");
      expect(auth.password).toBe("hashedPassword");
      expect(auth.name).toBe("Test User");
      expect(auth.permissions).toEqual(["read"]);
    });

    it("should require all fields in type", () => {
      const auth: Auth = {
        id: "complete-user",
        email: "complete@example.com",
        password: "completePassword",
        name: "Complete User",
        permissions: ["all"],
      };

      // All fields should be present
      expect(Object.keys(auth)).toHaveLength(5);
      expect(auth).toHaveProperty("id");
      expect(auth).toHaveProperty("email");
      expect(auth).toHaveProperty("password");
      expect(auth).toHaveProperty("name");
      expect(auth).toHaveProperty("permissions");
    });
  });
});
