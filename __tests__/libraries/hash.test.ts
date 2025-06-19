import { hashPassword, verifyPassword, generateToken } from "@/libraries/hash";

describe("Hash Library", () => {
  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "testPassword123";
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it("should generate hash in correct format", async () => {
      const password = "testPassword123";
      const hashedPassword = await hashPassword(password);

      // Format: pbkdf2:100000:salt:hash
      const parts = hashedPassword.split(":");
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe("pbkdf2");
      expect(parts[1]).toBe("100000");
      expect(parts[2]).toHaveLength(32); // 16 bytes = 32 hex characters
      expect(parts[3]).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it("should generate different hashes for same password (due to salt)", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      // However, both should be verifiable with verifyPassword
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });

    it("should be able to hash empty password", async () => {
      const password = "";
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.split(":")).toHaveLength(4);
    });

    it("should be able to hash long password", async () => {
      const password = "a".repeat(1000);
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.split(":")).toHaveLength(4);
    });

    it("should be able to hash password with special characters", async () => {
      const password = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.split(":")).toHaveLength(4);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password successfully", async () => {
      const password = "testPassword123";
      const hashedPassword = await hashPassword(password);

      const result = await verifyPassword(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should fail verification with wrong password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hashedPassword = await hashPassword(password);

      const result = await verifyPassword(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it("should fail verification with invalid hash format", async () => {
      const password = "testPassword123";
      const invalidHash = "invalid:hash:format";

      const result = await verifyPassword(password, invalidHash);
      expect(result).toBe(false);
    });

    it("should fail verification with empty hash", async () => {
      const password = "testPassword123";
      const emptyHash = "";

      const result = await verifyPassword(password, emptyHash);
      expect(result).toBe(false);
    });

    it("should fail verification with invalid algorithm", async () => {
      const password = "testPassword123";
      const invalidHash = "md5:1000:salt:hash";

      const result = await verifyPassword(password, invalidHash);
      expect(result).toBe(false);
    });

    it("should fail verification with invalid salt", async () => {
      const password = "testPassword123";
      const invalidHash = "pbkdf2:100000:invalidSalt:hash";

      const result = await verifyPassword(password, invalidHash);
      expect(result).toBe(false);
    });

    it("should verify empty password correctly", async () => {
      const password = "";
      const hashedPassword = await hashPassword(password);

      const result1 = await verifyPassword(password, hashedPassword);
      const result2 = await verifyPassword("notEmpty", hashedPassword);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it("should verify password with special characters correctly", async () => {
      const password = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const hashedPassword = await hashPassword(password);

      const result = await verifyPassword(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should fail verification when case differs", async () => {
      const password = "TestPassword123";
      const hashedPassword = await hashPassword(password);

      const result = await verifyPassword("testpassword123", hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("should generate token with default length", async () => {
      const token = await generateToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it("should generate token with specified length", async () => {
      const length = 16;
      const token = await generateToken(length);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(32); // 16 bytes = 32 hex characters
    });

    it("should generate different tokens on different calls", async () => {
      const token1 = await generateToken();
      const token2 = await generateToken();

      expect(token1).not.toBe(token2);
    });

    it("should be able to generate small length token", async () => {
      const length = 1;
      const token = await generateToken(length);

      expect(token).toBeDefined();
      expect(token.length).toBe(2); // 1 byte = 2 hex characters
    });

    it("should be able to generate large length token", async () => {
      const length = 128;
      const token = await generateToken(length);

      expect(token).toBeDefined();
      expect(token.length).toBe(256); // 128 bytes = 256 hex characters
    });

    it("should generate token with only hexadecimal characters", async () => {
      const token = await generateToken();

      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete hash→verification flow correctly", async () => {
      const passwords = [
        "simplePassword",
        "Complex!Pass@123",
        "",
        "日本語パスワード",
        "a".repeat(500),
      ];

      for (const password of passwords) {
        const hashedPassword = await hashPassword(password);
        const isValid = await verifyPassword(password, hashedPassword);
        expect(isValid).toBe(true);

        // Should fail with wrong password
        const isInvalid = await verifyPassword(password + "wrong", hashedPassword);
        expect(isInvalid).toBe(false);
      }
    });

    it("should ensure multiple tokens are unique", async () => {
      const tokens = await Promise.all(
        Array.from({ length: 100 }, () => generateToken())
      );

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });
});
