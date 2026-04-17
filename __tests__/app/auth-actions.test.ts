jest.mock("@/services/auth_service", () => ({
  __esModule: true,
  AuthService: jest.fn(),
}));

import {
  InvalidCredentials,
  InvalidInput,
  Success,
  EmailVerificationRequired,
} from "@/constants/auth";
import { signInAction } from "@/app/(site)/(unauthorized)/(auth)/signin/actions";
import { signUpAction } from "@/app/(site)/(unauthorized)/(auth)/signup/actions";
import { forgotPasswordAction } from "@/app/(site)/(unauthorized)/(auth)/forgot-password/actions";
import { resetPasswordAction } from "@/app/(site)/(unauthorized)/(auth)/reset-password/actions";
import {
  verifyEmailAction,
  resendVerificationEmailAction,
} from "@/app/(site)/(unauthorized)/(auth)/verify-email/actions";
import {
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

type AuthServiceModule = {
  AuthService: jest.Mock;
};

const getAuthServiceMock = () =>
  (jest.requireMock("@/services/auth_service") as AuthServiceModule)
    .AuthService;

describe("auth actions", () => {
  let authService: {
    signIn: jest.Mock;
    signUp: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
    verifyEmail: jest.Mock;
    resendVerificationEmail: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    installTestLoggerAdapters();

    authService = {
      signIn: jest.fn(),
      signUp: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
    };

    getAuthServiceMock().mockImplementation(() => authService);
  });

  afterEach(() => {
    resetTestLoggerState();
  });

  describe("signInAction", () => {
    it("入力不正なら InvalidInput を返す", async () => {
      const result = await signInAction({
        email: "invalid-email",
        password: "short",
      });

      expect(result).toBe(InvalidInput);
      expect(authService.signIn).not.toHaveBeenCalled();
    });

    it("email_not_verified を EmailVerificationRequired に変換する", async () => {
      authService.signIn.mockResolvedValue({
        success: false,
        reason: "email_not_verified",
      });

      const result = await signInAction({
        email: "user@example.com",
        password: "Password123!",
      });

      expect(result).toBe(EmailVerificationRequired);
    });

    it("invalid_credentials を InvalidCredentials に変換する", async () => {
      authService.signIn.mockResolvedValue({
        success: false,
        reason: "invalid_credentials",
      });

      const result = await signInAction({
        email: "user@example.com",
        password: "Password123!",
      });

      expect(result).toBe(InvalidCredentials);
    });

    it("成功時は Success を返す", async () => {
      authService.signIn.mockResolvedValue({
        success: true,
      });

      const result = await signInAction({
        email: "user@example.com",
        password: "Password123!",
      });

      expect(result).toBe(Success);
    });

    it("例外時は InvalidCredentials を返し logger.error を呼ぶ", async () => {
      authService.signIn.mockRejectedValue(new Error("sign_in_failed"));

      const result = await signInAction({
        email: "user@example.com",
        password: "Password123!",
      });

      expect(result).toBe(InvalidCredentials);
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "signin_actions",
          event: "signin_actions.sign_in.failed",
          context: expect.objectContaining({
            action: "sign_in",
          }),
        }),
      ]);
    });
  });

  describe("signUpAction", () => {
    it("入力不正なら InvalidInput を返す", async () => {
      const result = await signUpAction({
        email: "invalid-email",
        password: "Password123!",
        confirm_password: "Password123!",
        name: "",
      });

      expect(result).toBe(InvalidInput);
      expect(authService.signUp).not.toHaveBeenCalled();
    });

    it("失敗時は InvalidCredentials を返す", async () => {
      authService.signUp.mockResolvedValue({
        success: false,
        reason: "invalid_credentials",
      });

      const result = await signUpAction({
        email: "user@example.com",
        password: "Password123!",
        confirm_password: "Password123!",
        name: "Alice",
      });

      expect(result).toBe(InvalidCredentials);
    });

    it("メール認証必須なら EmailVerificationRequired を返す", async () => {
      authService.signUp.mockResolvedValue({
        success: true,
        requiresEmailVerification: true,
      });

      const result = await signUpAction({
        email: "user@example.com",
        password: "Password123!",
        confirm_password: "Password123!",
        name: "Alice",
      });

      expect(result).toBe(EmailVerificationRequired);
    });

    it("成功時は Success を返す", async () => {
      authService.signUp.mockResolvedValue({
        success: true,
        requiresEmailVerification: false,
      });

      const result = await signUpAction({
        email: "user@example.com",
        password: "Password123!",
        confirm_password: "Password123!",
        name: "Alice",
      });

      expect(result).toBe(Success);
    });

    it("例外時は InvalidCredentials を返し logger.error を呼ぶ", async () => {
      authService.signUp.mockRejectedValue(new Error("sign_up_failed"));

      const result = await signUpAction({
        email: "user@example.com",
        password: "Password123!",
        confirm_password: "Password123!",
        name: "Alice",
      });

      expect(result).toBe(InvalidCredentials);
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "signup_actions",
          event: "signup_actions.sign_up.failed",
          context: expect.objectContaining({
            action: "sign_up",
          }),
        }),
      ]);
    });
  });

  describe("forgotPasswordAction / resetPasswordAction", () => {
    it("forgotPasswordAction は safeParse 失敗時に InvalidInput を返す", async () => {
      const result = await forgotPasswordAction({
        email: "invalid-email",
      });

      expect(result).toBe(InvalidInput);
      expect(authService.forgotPassword).not.toHaveBeenCalled();
    });

    it("forgotPasswordAction は成功時に Success を返す", async () => {
      authService.forgotPassword.mockResolvedValue(undefined);

      const result = await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(result).toBe(Success);
      expect(authService.forgotPassword).toHaveBeenCalledWith({
        email: "user@example.com",
      });
    });

    it("forgotPasswordAction は例外時に InvalidInput を返し logger.error を呼ぶ", async () => {
      authService.forgotPassword.mockRejectedValue(new Error("forgot_failed"));

      const result = await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(result).toBe(InvalidInput);
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "forgot_password_actions",
          event: "forgot_password_actions.forgot_password.failed",
          context: expect.objectContaining({
            action: "forgot_password",
          }),
        }),
      ]);
    });

    it("resetPasswordAction は safeParse 失敗時に InvalidInput を返す", async () => {
      const result = await resetPasswordAction({
        token: "",
        password: "short",
        confirm_password: "short",
      });

      expect(result).toBe(InvalidInput);
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it("resetPasswordAction は成功時に Success を返す", async () => {
      authService.resetPassword.mockResolvedValue(undefined);

      const result = await resetPasswordAction({
        token: "reset-token",
        password: "Password123!",
        confirm_password: "Password123!",
      });

      expect(result).toBe(Success);
      expect(authService.resetPassword).toHaveBeenCalledWith({
        token: "reset-token",
        password: "Password123!",
        confirm_password: "Password123!",
      });
    });

    it("resetPasswordAction は例外時に InvalidInput を返し logger.error を呼ぶ", async () => {
      authService.resetPassword.mockRejectedValue(new Error("reset_failed"));

      const result = await resetPasswordAction({
        token: "reset-token",
        password: "Password123!",
        confirm_password: "Password123!",
      });

      expect(result).toBe(InvalidInput);
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "reset_password_actions",
          event: "reset_password_actions.reset_password.failed",
          context: expect.objectContaining({
            action: "reset_password",
          }),
        }),
      ]);
    });
  });

  describe("verifyEmailAction / resendVerificationEmailAction", () => {
    it("verifyEmailAction は例外時にフォールバックメッセージを返す", async () => {
      authService.verifyEmail.mockRejectedValue(new Error("boom"));

      const result = await verifyEmailAction("token-1");

      expect(result).toEqual({
        success: false,
        message: "認証処理中にエラーが発生しました。",
        code: 500,
      });
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "verify_email_actions",
          event: "verify_email_actions.verify_email.failed",
          context: expect.objectContaining({
            action: "verify_email",
          }),
        }),
      ]);
    });

    it("resendVerificationEmailAction は例外時にフォールバックメッセージを返す", async () => {
      authService.resendVerificationEmail.mockRejectedValue(new Error("boom"));

      const result = await resendVerificationEmailAction("user@example.com");

      expect(result).toEqual({
        success: false,
        message: "認証メールの再送信中にエラーが発生しました。",
        code: 500,
      });
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "verify_email_actions",
          event: "verify_email_actions.resend_verification_email.failed",
          context: expect.objectContaining({
            action: "resend_verification_email",
          }),
        }),
      ]);
    });
  });
});
