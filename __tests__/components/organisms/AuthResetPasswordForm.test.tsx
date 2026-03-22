import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import AuthResetPasswordForm from "@/components/organisms/AuthResetPasswordForm";
import { InvalidInput, Success } from "@/constants/auth";
import type { ReactNode } from "react";

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const messages = {
  Auth: {
    reset_password_title: "Reset password",
    reset_password_description: "Choose a new password for your account",
    invalid_reset_link: "Invalid reset link",
    go_to_forgot_password: "Go to forgot password",
    new_password: "New password",
    confirm_password: "Confirm password",
    resetting: "Resetting...",
    reset_password: "Reset password",
    invalid_input: "Invalid input",
    system_error: "System error",
    validation: {
      password_required: "Password is required",
      password_min_length: "Password must be at least 8 characters",
      password_max_length: "Password must be at most 256 characters",
      password_complexity:
        "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character (!@#$%^&*)",
      passwords_do_not_match: "Passwords do not match",
      token_required: "Token is required",
      token_min_length: "Token must be at least 1 character",
    },
  },
};

const renderWithIntl = (component: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );

describe("AuthResetPasswordForm", () => {
  const mockOnSubmit = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("shows an invalid link message when token is missing", () => {
    renderWithIntl(<AuthResetPasswordForm token="" onSubmit={mockOnSubmit} />);

    expect(screen.getByText("Invalid reset link")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to forgot password" })
    ).toHaveAttribute("href", "/forgot-password");
    expect(
      screen.queryByRole("button", { name: "Reset password" })
    ).not.toBeInTheDocument();
  });

  it("shows validation errors and prevents submission when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <AuthResetPasswordForm token="reset-token" onSubmit={mockOnSubmit} />
    );

    await user.type(screen.getByLabelText("New password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password2!");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits valid password reset data", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(Success);

    renderWithIntl(
      <AuthResetPasswordForm token="reset-token" onSubmit={mockOnSubmit} />
    );

    await user.type(screen.getByLabelText("New password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        token: "reset-token",
        password: "Password1!",
        confirm_password: "Password1!",
      });
    });
  });

  it("shows a loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit: ((value: typeof Success) => void) | undefined;
    mockOnSubmit.mockImplementation(
      () =>
        new Promise<typeof Success>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    renderWithIntl(
      <AuthResetPasswordForm token="reset-token" onSubmit={mockOnSubmit} />
    );

    await user.type(screen.getByLabelText("New password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Resetting..." })).toBeDisabled();
    });

    resolveSubmit?.(Success);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("shows invalid input errors returned by the submit handler", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(InvalidInput);

    renderWithIntl(
      <AuthResetPasswordForm token="reset-token" onSubmit={mockOnSubmit} />
    );

    await user.type(screen.getByLabelText("New password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid input")).toBeInTheDocument();
    });
  });

  it("shows a system error when submission throws", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error("network error"));

    renderWithIntl(
      <AuthResetPasswordForm token="reset-token" onSubmit={mockOnSubmit} />
    );

    await user.type(screen.getByLabelText("New password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(screen.getByText("System error")).toBeInTheDocument();
    });
  });
});
