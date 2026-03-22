import { ForgotPasswordRequestSchema } from "@/requests/forgot_password_request";
import { PasswordChangeRequestSchema } from "@/requests/password_change_request";
import { ProfileUpdateRequestSchema } from "@/requests/profile_update_request";
import { ResetPasswordRequestSchema } from "@/requests/reset_password_request";
import { SignInRequestSchema } from "@/requests/signin_request";
import { SignUpRequestSchema } from "@/requests/signup_request";

describe("auth request schemas", () => {
  describe("SignInRequestSchema", () => {
    it("should accept a valid payload", () => {
      const result = SignInRequestSchema.parse({
        email: "user@example.com",
        password: "Password1!",
      });

      expect(result).toEqual({
        email: "user@example.com",
        password: "Password1!",
      });
    });

    it("should reject an invalid email address", () => {
      const result = SignInRequestSchema.safeParse({
        email: "invalid-email",
        password: "Password1!",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Please enter a valid email address"
      );
    });

    it("should reject a password shorter than 8 characters", () => {
      const result = SignInRequestSchema.safeParse({
        email: "user@example.com",
        password: "short",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Password must be at least 8 characters"
      );
    });
  });

  describe("SignUpRequestSchema", () => {
    it("should accept a valid payload", () => {
      const result = SignUpRequestSchema.parse({
        email: "user@example.com",
        password: "Password1!",
        confirm_password: "Password1!",
        name: "Example User",
      });

      expect(result).toEqual({
        email: "user@example.com",
        password: "Password1!",
        confirm_password: "Password1!",
        name: "Example User",
      });
    });

    it("should reject weak passwords", () => {
      const result = SignUpRequestSchema.safeParse({
        email: "user@example.com",
        password: "password",
        confirm_password: "password",
        name: "Example User",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character (!@#$%^&*)"
      );
    });

    it("should reject mismatched passwords on the confirm field", () => {
      const result = SignUpRequestSchema.safeParse({
        email: "user@example.com",
        password: "Password1!",
        confirm_password: "Password2!",
        name: "Example User",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["confirm_password"]);
      expect(result.error?.issues[0]?.message).toBe("Passwords do not match");
    });

    it("should reject an empty name", () => {
      const result = SignUpRequestSchema.safeParse({
        email: "user@example.com",
        password: "Password1!",
        confirm_password: "Password1!",
        name: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Name must be at least 1 character"
      );
    });
  });

  describe("ForgotPasswordRequestSchema", () => {
    it("should accept a valid email address", () => {
      const result = ForgotPasswordRequestSchema.parse({
        email: "user@example.com",
      });

      expect(result).toEqual({
        email: "user@example.com",
      });
    });

    it("should reject an invalid email address", () => {
      const result = ForgotPasswordRequestSchema.safeParse({
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Please enter a valid email address"
      );
    });
  });

  describe("ResetPasswordRequestSchema", () => {
    it("should accept a valid payload", () => {
      const result = ResetPasswordRequestSchema.parse({
        password: "Password1!",
        confirm_password: "Password1!",
        token: "reset-token",
      });

      expect(result).toEqual({
        password: "Password1!",
        confirm_password: "Password1!",
        token: "reset-token",
      });
    });

    it("should reject an empty token", () => {
      const result = ResetPasswordRequestSchema.safeParse({
        password: "Password1!",
        confirm_password: "Password1!",
        token: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Token must be at least 1 character"
      );
    });

    it("should reject mismatched passwords on the confirm field", () => {
      const result = ResetPasswordRequestSchema.safeParse({
        password: "Password1!",
        confirm_password: "Password2!",
        token: "reset-token",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["confirm_password"]);
      expect(result.error?.issues[0]?.message).toBe("Passwords do not match");
    });
  });

  describe("PasswordChangeRequestSchema", () => {
    it("should accept a valid payload", () => {
      const result = PasswordChangeRequestSchema.parse({
        currentPassword: "Current1!",
        newPassword: "Password1!",
        confirmPassword: "Password1!",
      });

      expect(result).toEqual({
        currentPassword: "Current1!",
        newPassword: "Password1!",
        confirmPassword: "Password1!",
      });
    });

    it("should reject mismatched new passwords", () => {
      const result = PasswordChangeRequestSchema.safeParse({
        currentPassword: "Current1!",
        newPassword: "Password1!",
        confirmPassword: "Password2!",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
      expect(result.error?.issues[0]?.message).toBe(
        "new_passwords_do_not_match"
      );
    });

    it("should reject weak new passwords", () => {
      const result = PasswordChangeRequestSchema.safeParse({
        currentPassword: "Current1!",
        newPassword: "password",
        confirmPassword: "password",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character (!@#$%^&*)"
      );
    });
  });

  describe("ProfileUpdateRequestSchema", () => {
    it("should accept a valid payload", () => {
      const result = ProfileUpdateRequestSchema.parse({
        name: "Updated User",
        email: "user@example.com",
      });

      expect(result).toEqual({
        name: "Updated User",
        email: "user@example.com",
      });
    });

    it("should reject an empty name", () => {
      const result = ProfileUpdateRequestSchema.safeParse({
        name: "",
        email: "user@example.com",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("name_min_length");
    });

    it("should reject an invalid email address", () => {
      const result = ProfileUpdateRequestSchema.safeParse({
        name: "Updated User",
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("email_invalid");
    });
  });
});
