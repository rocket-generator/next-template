import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import AuthSigninForm from "@/components/organisms/AuthSigninForm";
import { InvalidCredentials, InvalidInput, Success } from "@/constants/auth";

// モックの設定
jest.mock("next/link", () => {
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
  return MockLink;
});

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "signin": "ログイン",
      "email": "メールアドレス",
      "password": "パスワード",
      "signing_in": "ログイン中...",
      "invalid_input": "入力内容が不正です",
      "invalid_credentials": "メールアドレスまたはパスワードが不正です",
      "system_error": "システムエラーが発生しました",
      "if_forgot_password": "パスワードを忘れた場合",
      "if_you_do_not_have_an_account": "アカウントをお持ちでない場合",
      "signup": "新規登録",
    };
    return translations[key] || key;
  },
}));

describe("AuthSigninForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render form with required elements", () => {
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByTestId("email-input")).toBeInTheDocument();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByTestId("signin-submit-button")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
    });

    it("should display form labels correctly", () => {
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
      expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("should handle form submission with valid data", async () => {
      mockOnSubmit.mockResolvedValue(Success);
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should show loading state during submission", async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(Success), 100)));
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);
      });
      
      expect(screen.getByText("ログイン中...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it("should maintain loading state on success", async () => {
      mockOnSubmit.mockResolvedValue(Success);
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
      
      // 成功時はローディング状態を維持する
      expect(screen.getByText("ログイン中...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display invalid input error", async () => {
      mockOnSubmit.mockResolvedValue(InvalidInput);
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText("入力内容が不正です")).toBeInTheDocument();
      });
      
      // エラー時はローディング状態を解除する
      expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it("should display invalid credentials error", async () => {
      mockOnSubmit.mockResolvedValue(InvalidCredentials);
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText("メールアドレスまたはパスワードが不正です")).toBeInTheDocument();
      });
      
      // エラー時はローディング状態を解除する
      expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it("should display system error on exception", async () => {
      mockOnSubmit.mockRejectedValue(new Error("Network error"));
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText("システムエラーが発生しました")).toBeInTheDocument();
      });
      
      // エラー時はローディング状態を解除する
      expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it("should clear error when resubmitting", async () => {
      mockOnSubmit
        .mockResolvedValueOnce(InvalidCredentials)
        .mockResolvedValueOnce(Success);
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      // 最初の送信（エラー）
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText("メールアドレスまたはパスワードが不正です")).toBeInTheDocument();
      });
      
      // 2回目の送信（成功）
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: "correctpassword" } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText("メールアドレスまたはパスワードが不正です")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
      expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    });

    it("should have proper button roles", () => {
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole("button", { name: "ログイン" });
      expect(submitButton).toBeInTheDocument();
    });

    it("should disable button during loading", async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(Success), 100)));
      
      render(<AuthSigninForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("signin-submit-button");
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);
      });
      
      expect(submitButton).toBeDisabled();
    });
  });
}); 