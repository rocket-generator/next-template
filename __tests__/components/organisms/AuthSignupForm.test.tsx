import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import AuthSignupForm from "@/components/organisms/AuthSignupForm";
import {
  EmailVerificationRequired,
  InvalidCredentials,
  InvalidInput,
  Success,
} from "@/constants/auth";
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
    signup: "Sign up",
    create_account: "Create your account",
    name: "Name",
    name_placeholder: "Your name",
    email: "Email",
    password: "Password",
    confirm_password: "Confirm password",
    signing_up: "Signing up...",
    invalid_input: "Invalid input",
    invalid_credentials: "Invalid credentials",
    system_error: "System error",
    already_have_account: "Already have an account?",
    signin: "Sign in",
    validation: {
      email_required: "Email is required",
      email_invalid: "Please enter a valid email address",
      password_required: "Password is required",
      password_min_length: "Password must be at least 8 characters",
      password_max_length: "Password must be at most 256 characters",
      password_complexity:
        "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character (!@#$%^&*)",
      passwords_do_not_match: "Passwords do not match",
      name_required: "Name is required",
      name_min_length: "Name must be at least 1 character",
    },
  },
};

const renderWithIntl = (component: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );

describe("AuthSignupForm", () => {
  const mockOnSubmit = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders the signup form", () => {
    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Sign up",
      })
    ).toBeInTheDocument();
  });

  it("shows validation errors and prevents submission when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Example User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password2!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits valid form data", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(Success);

    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Example User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: "Example User",
        email: "user@example.com",
        password: "Password1!",
        confirm_password: "Password1!",
      });
    });
  });

  it("shows a loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit:
      | ((value: typeof Success | typeof EmailVerificationRequired) => void)
      | undefined;
    mockOnSubmit.mockImplementation(
      () =>
        new Promise<typeof Success | typeof EmailVerificationRequired>(
          (resolve) => {
            resolveSubmit = resolve;
          }
        )
    );

    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Example User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Signing up..." })
      ).toBeDisabled();
    });

    resolveSubmit?.(Success);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("shows invalid input errors returned by the submit handler", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(InvalidInput);

    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Example User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid input")).toBeInTheDocument();
    });
  });

  it("shows invalid credentials errors returned by the submit handler", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(InvalidCredentials);

    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Example User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("leaves error handling to the parent when email verification is required", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(EmailVerificationRequired);

    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Example User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    expect(screen.queryByText("Invalid input")).not.toBeInTheDocument();
    expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    expect(screen.queryByText("System error")).not.toBeInTheDocument();
  });

  it("shows a system error when submission throws", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error("network error"));

    renderWithIntl(<AuthSignupForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Example User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("System error")).toBeInTheDocument();
    });
  });
});
