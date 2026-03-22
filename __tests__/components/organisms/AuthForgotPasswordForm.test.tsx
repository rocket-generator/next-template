import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import AuthForgotPasswordForm from "@/components/organisms/AuthForgotPasswordForm";
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
    forgot_password_title: "Forgot password",
    forgot_password_description: "Enter your email to receive a reset link",
    email: "Email",
    send_reset_link: "Send reset link",
    sending: "Sending...",
    invalid_input: "Invalid input",
    system_error: "System error",
    remembered_password: "Remembered your password?",
    signin: "Sign in",
    email_sent: "Email sent",
    check_email_for_reset_link: "Check your email for the reset link",
    didnt_receive_email: "Didn't receive the email?",
    try_again: "Try again",
    validation: {
      email_required: "Email is required",
      email_invalid: "Please enter a valid email address",
    },
  },
};

const renderWithIntl = (component: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );

describe("AuthForgotPasswordForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnTryAgain = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders the forgot password form", () => {
    renderWithIntl(
      <AuthForgotPasswordForm
        isSubmitted={false}
        onSubmit={mockOnSubmit}
        onTryAgain={mockOnTryAgain}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Forgot password" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" })
    ).toBeInTheDocument();
  });

  it("shows validation errors and prevents submission for invalid email", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <AuthForgotPasswordForm
        isSubmitted={false}
        onSubmit={mockOnSubmit}
        onTryAgain={mockOnTryAgain}
      />
    );

    await user.type(screen.getByLabelText("Email"), "invalid-email");
    fireEvent.submit(
      screen.getByRole("button", { name: "Send reset link" }).closest("form")!
    );

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits valid email data", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(Success);

    renderWithIntl(
      <AuthForgotPasswordForm
        isSubmitted={false}
        onSubmit={mockOnSubmit}
        onTryAgain={mockOnTryAgain}
      />
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: "user@example.com",
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
      <AuthForgotPasswordForm
        isSubmitted={false}
        onSubmit={mockOnSubmit}
        onTryAgain={mockOnTryAgain}
      />
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
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
      <AuthForgotPasswordForm
        isSubmitted={false}
        onSubmit={mockOnSubmit}
        onTryAgain={mockOnTryAgain}
      />
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid input")).toBeInTheDocument();
    });
  });

  it("shows a system error when submission throws", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error("network error"));

    renderWithIntl(
      <AuthForgotPasswordForm
        isSubmitted={false}
        onSubmit={mockOnSubmit}
        onTryAgain={mockOnTryAgain}
      />
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByText("System error")).toBeInTheDocument();
    });
  });

  it("renders the success screen and calls onTryAgain", async () => {
    const user = userEvent.setup();
    mockOnTryAgain.mockResolvedValue(undefined);

    renderWithIntl(
      <AuthForgotPasswordForm
        isSubmitted
        onSubmit={mockOnSubmit}
        onTryAgain={mockOnTryAgain}
      />
    );

    expect(screen.getByRole("heading", { name: "Email sent" })).toBeInTheDocument();
    expect(
      screen.getByText("Check your email for the reset link")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(mockOnTryAgain).toHaveBeenCalled();
  });
});
