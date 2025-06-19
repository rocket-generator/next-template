import { UserSchema, User, transformPrismToModel } from "@/models/user";
import { User as PrismaUser } from "@/generated/prisma";

describe("User Model", () => {
  describe("UserSchema", () => {
    it("should validate a valid user object", () => {
      const validUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedPassword123",
        name: "Test User",
        permissions: ["read", "write"],
      };

      const result = UserSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it("should inherit all Auth schema validations", () => {
      // Since UserSchema is just AuthSchema, it should have same validations
      const validUser = {
        id: "user-456",
        email: "user@example.com",
        password: "hashedPassword456",
        name: "Another User",
        permissions: ["admin"],
      };

      const result = UserSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it("should fail validation for invalid data", () => {
      const invalidUser = {
        id: 123, // Should be string
        email: "test@example.com",
        password: "password",
        name: "Test User",
        permissions: ["read"],
      };

      expect(() => UserSchema.parse(invalidUser)).toThrow();
    });
  });

  describe("transformPrismToModel", () => {
    it("should transform Prisma user to model user", () => {
      const prismaUser: PrismaUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: ["read", "write"], // This will be a JSON value from Prisma
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const result = transformPrismToModel(prismaUser);

      // Should include all required fields
      expect(result.id).toBe(prismaUser.id);
      expect(result.email).toBe(prismaUser.email);
      expect(result.password).toBe(prismaUser.password);
      expect(result.name).toBe(prismaUser.name);
      expect(result.permissions).toEqual(prismaUser.permissions);
    });

    it("should transform Prisma user correctly without extra fields", () => {
      const prismaUser: PrismaUser = {
        id: "user-456",
        email: "another@example.com",
        password: "anotherPassword",
        name: "Another User",
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformPrismToModel(prismaUser);

      // The transform function should return a valid User object based on AuthSchema
      expect(result.id).toBe("user-456");
      expect(result.email).toBe("another@example.com");
      expect(result.name).toBe("Another User");
      expect(result.permissions).toEqual([]);
    });

    it("should handle empty permissions array", () => {
      const prismaUser: PrismaUser = {
        id: "user-789",
        email: "empty@example.com",
        password: "emptyPassword",
        name: "Empty Permissions User",
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformPrismToModel(prismaUser);
      expect(result.permissions).toEqual([]);
    });

    it("should handle complex permissions", () => {
      const prismaUser: PrismaUser = {
        id: "admin-001",
        email: "admin@example.com",
        password: "adminPassword",
        name: "Admin User",
        permissions: ["read", "write", "delete", "admin", "super-admin"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformPrismToModel(prismaUser);
      expect(result.permissions).toHaveLength(5);
      expect(result.permissions).toContain("super-admin");
    });

    it("should not include Prisma metadata fields in result", () => {
      const prismaUser: PrismaUser = {
        id: "user-meta",
        email: "meta@example.com",
        password: "metaPassword",
        name: "Meta User",
        permissions: ["read"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformPrismToModel(prismaUser);

      // Should not include createdAt and updatedAt in the transformed model
      expect(result).not.toHaveProperty("createdAt");
      expect(result).not.toHaveProperty("updatedAt");
    });

    it("should handle JSON permissions from database", () => {
      // Simulate how Prisma might return JSON data
      const prismaUser: PrismaUser = {
        id: "json-user",
        email: "json@example.com",
        password: "jsonPassword",
        name: "JSON User",
        permissions: JSON.parse('["read","write"]') as any, // Simulating JSON from DB
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformPrismToModel(prismaUser);
      expect(result.permissions).toEqual(["read", "write"]);
    });
  });

  describe("User Type", () => {
    it("should infer correct type", () => {
      const user: User = {
        id: "user-type",
        email: "type@example.com",
        password: "typePassword",
        name: "Type User",
        permissions: ["read"],
      };

      // TypeScript will ensure this compiles
      expect(user.id).toBe("user-type");
      expect(user.email).toBe("type@example.com");
      expect(user.password).toBe("typePassword");
      expect(user.name).toBe("Type User");
      expect(user.permissions).toEqual(["read"]);
    });

    it("should be compatible with Auth type", () => {
      // Since User type is based on Auth, they should be compatible
      const user: User = {
        id: "auth-compatible",
        email: "auth@example.com",
        password: "authPassword",
        name: "Auth Compatible User",
        permissions: ["all"],
      };

      // All Auth fields should be present
      expect(Object.keys(user)).toHaveLength(5);
    });
  });
});
