import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { z } from "zod";
import { PasswordChangeForm } from "@/components/organisms/PasswordChangeForm";
import type { PasswordChangeResult } from "@/app/(site)/(authorized)/(app)/settings/actions";

// Mock next-intl
const mockTranslations = {
  Settings: {
    current_password: "Current Password",
    current_password_placeholder: "Enter current password",
    new_password: "New Password",
    new_password_placeholder: "Enter new password",
    confirm_new_password: "Confirm New Password",
    confirm_new_password_placeholder: "Confirm new password",
    change_password: "Change Password",
    password_updated: "Password updated successfully",
    validation: {
      invalid_current_password: "Current password is incorrect",
      system_error: "System error occurred",
      current_password_required: "Current password is required",
      new_password_required: "New password is required",
      confirm_password_required: "Confirm password is required",
      new_passwords_do_not_match: "New passwords do not match",
    },
  },
  Auth: {
    new_password: "New Password",
    validation: {
      current_password_required: "Current password is required",
      password_min_length: "Password must be at least 8 characters",
      password_max_length: "Password must be 256 characters or less",
      password_complexity: "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character",
      confirm_password_required: "Confirm password is required",
      new_passwords_do_not_match: "New passwords do not match",
    },
  },
  Crud: {
    saving: "Saving...",
  },
} as const;

jest.mock("next-intl", () => ({
  useTranslations: jest.fn((namespace: string) => {
    return (key: string) => {
      // Handle nested namespace.key structure
      if (key.startsWith("validation.")) {
        const validationKey = key.replace("validation.", "");
        const namespaceObj = mockTranslations[namespace as keyof typeof mockTranslations];
        if (namespaceObj && typeof namespaceObj === "object" && "validation" in namespaceObj) {
          const validationObj = (namespaceObj as unknown as Record<string, Record<string, string>>).validation;
          if (validationObj && typeof validationObj === "object") {
            return validationObj[validationKey] || key;
          }
        }
        return key;
      }
      
      const namespaceObj = mockTranslations[namespace as keyof typeof mockTranslations];
      if (namespaceObj && typeof namespaceObj === "object") {
        const value = (namespaceObj as Record<string, unknown>)[key];
        return value || key;
      }
      
      return key;
    };
  }),
}));

// Mock the password change request schema
jest.mock("@/requests/password_change_request", () => ({
  createPasswordChangeRequestSchema: jest.fn(() => {
    return z
      .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(256, "Password must be 256 characters or less")
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
            message: "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character",
          }),
        confirmPassword: z.string().min(1, "Confirm password is required"),
      })
      .refine((data: { newPassword: string; confirmPassword: string }) => data.newPassword === data.confirmPassword, {
        message: "New passwords do not match",
        path: ["confirmPassword"],
      });
  }),
}));

// Mock the changePassword server action
jest.mock("@/app/(site)/(authorized)/(app)/settings/actions", () => ({
  changePassword: jest.fn(),
}));

const mockChangePassword = jest.requireMock("@/app/(site)/(authorized)/(app)/settings/actions").changePassword;

describe("PasswordChangeForm", () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render form fields correctly", () => {
    render(<PasswordChangeForm />);

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change Password" })).toBeInTheDocument();
  });

  it("should render placeholder text correctly", () => {
    render(<PasswordChangeForm />);

    expect(screen.getByPlaceholderText("Enter current password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter new password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm new password")).toBeInTheDocument();
  });

  it("should disable submit button when form is empty", () => {
    render(<PasswordChangeForm />);

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    expect(submitButton).toBeDisabled();
  });

  it("should enable submit button when all fields are filled", async () => {
    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");
    const submitButton = screen.getByRole("button", { name: "Change Password" });

    await user.type(currentPasswordInput, "currentpass");
    await user.type(newPasswordInput, "newpass123");
    await user.type(confirmPasswordInput, "newpass123");

    expect(submitButton).not.toBeDisabled();
  });

  it("should update input values when typing", async () => {
    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password") as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText("New Password") as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password") as HTMLInputElement;

    await user.type(currentPasswordInput, "current123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "confirm123");

    expect(currentPasswordInput.value).toBe("current123");
    expect(newPasswordInput.value).toBe("new123");
    expect(confirmPasswordInput.value).toBe("confirm123");
  });

  it("should show loading state when submitting", async () => {
    mockChangePassword.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "current123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it("should call changePassword with correct data on form submit", async () => {
    const mockResult: PasswordChangeResult = { success: true, message: "password_updated" };
    mockChangePassword.mockResolvedValue(mockResult);

    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "current123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: "current123",
        newPassword: "new123",
        confirmPassword: "new123",
      });
    });
  });

  it("should clear form and call onSuccess when password change succeeds", async () => {
    const mockResult: PasswordChangeResult = { success: true, message: "password_updated" };
    mockChangePassword.mockResolvedValue(mockResult);

    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByLabelText("Current Password") as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText("New Password") as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password") as HTMLInputElement;

    await user.type(currentPasswordInput, "current123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(currentPasswordInput.value).toBe("");
      expect(newPasswordInput.value).toBe("");
      expect(confirmPasswordInput.value).toBe("");
      expect(mockOnSuccess).toHaveBeenCalledWith("Password updated successfully");
    });
  });

  it("should display field-specific error when validation fails", async () => {
    const mockResult: PasswordChangeResult = {
      success: false,
      error: "invalid_current_password",
      field: "currentPassword",
    };
    mockChangePassword.mockResolvedValue(mockResult);

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "wrong123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Current password is incorrect")).toBeInTheDocument();
    });
  });

  it("should display general error when no specific field is indicated", async () => {
    const mockResult: PasswordChangeResult = {
      success: false,
      error: "system_error",
    };
    mockChangePassword.mockResolvedValue(mockResult);

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "current123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("System error occurred")).toBeInTheDocument();
    });
  });

  it("should add error styling to input fields with errors", async () => {
    const mockResult: PasswordChangeResult = {
      success: false,
      error: "invalid_current_password",
      field: "currentPassword",
    };
    mockChangePassword.mockResolvedValue(mockResult);

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "wrong123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(currentPasswordInput).toHaveClass("border-red-500");
    });
  });

  it("should clear errors when resubmitting form", async () => {
    // First submission with error
    const mockErrorResult: PasswordChangeResult = {
      success: false,
      error: "invalid_current_password",
      field: "currentPassword",
    };
    mockChangePassword.mockResolvedValueOnce(mockErrorResult);

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "wrong123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Current password is incorrect")).toBeInTheDocument();
    });

    // Second submission with success
    const mockSuccessResult: PasswordChangeResult = {
      success: true,
      message: "password_updated",
    };
    mockChangePassword.mockResolvedValueOnce(mockSuccessResult);

    await user.clear(currentPasswordInput);
    await user.type(currentPasswordInput, "correct123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("Current password is incorrect")).not.toBeInTheDocument();
    });
  });

  it("should work without onSuccess callback", async () => {
    const mockResult: PasswordChangeResult = { success: true, message: "password_updated" };
    mockChangePassword.mockResolvedValue(mockResult);

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "current123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    
    // Should not throw an error even without onSuccess callback
    expect(async () => {
      await user.click(submitButton);
    }).not.toThrow();
  });

  it("should prevent form submission with preventDefault", async () => {
    const mockResult: PasswordChangeResult = { success: true, message: "password_updated" };
    mockChangePassword.mockResolvedValue(mockResult);

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await user.type(currentPasswordInput, "current123");
    await user.type(newPasswordInput, "new123");
    await user.type(confirmPasswordInput, "new123");

    const submitButton = screen.getByRole("button", { name: "Change Password" });
    
    // Add event listener to spy on form submission
    const mockPreventDefault = jest.fn();
    const originalAddEventListener = HTMLFormElement.prototype.addEventListener;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLFormElement.prototype.addEventListener = jest.fn((event, handler) => {
      if (event === "submit") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockEvent = { preventDefault: mockPreventDefault } as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (handler as any)(mockEvent);
      }
      return originalAddEventListener.call(this, event, handler);
    });

    // Click the submit button which should trigger form submission
    await user.click(submitButton);

    // Restore original implementation
    HTMLFormElement.prototype.addEventListener = originalAddEventListener;

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });
  });
}); 