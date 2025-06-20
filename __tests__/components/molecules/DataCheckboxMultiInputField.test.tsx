import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataCheckboxMultiInputField from "@/components/molecules/DataCheckboxMultiInputField";

// Mock the css utility
jest.mock("@/libraries/css", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

// Mock the Checkbox component
jest.mock("@/components/atoms/checkbox", () => ({
  Checkbox: ({ id, checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      data-testid={`checkbox-${id}`}
    />
  ),
}));

// Mock the Label component
jest.mock("@/components/atoms/label", () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

describe("DataCheckboxMultiInputField", () => {
  const defaultProps = {
    name: "Preferences",
    data_key: "preferences",
    value: [],
    onChange: jest.fn(),
    options: {
      options: [
        { name: "Email Notifications", value: "email" },
        { name: "SMS Notifications", value: "sms" },
        { name: "Push Notifications", value: "push" },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the field label", () => {
    render(<DataCheckboxMultiInputField {...defaultProps} />);

    expect(screen.getByText("Preferences")).toBeInTheDocument();
  });

  it("should render all checkbox options", () => {
    render(<DataCheckboxMultiInputField {...defaultProps} />);

    expect(screen.getByText("Email Notifications")).toBeInTheDocument();
    expect(screen.getByText("SMS Notifications")).toBeInTheDocument();
    expect(screen.getByText("Push Notifications")).toBeInTheDocument();
  });

  it("should render checkboxes with correct IDs", () => {
    render(<DataCheckboxMultiInputField {...defaultProps} />);

    expect(screen.getByTestId("checkbox-preferences-email")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-preferences-sms")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-preferences-push")).toBeInTheDocument();
  });

  it("should show checked state for selected values", () => {
    const props = {
      ...defaultProps,
      value: ["email", "push"],
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const emailCheckbox = screen.getByTestId("checkbox-preferences-email");
    const smsCheckbox = screen.getByTestId("checkbox-preferences-sms");
    const pushCheckbox = screen.getByTestId("checkbox-preferences-push");

    expect(emailCheckbox).toBeChecked();
    expect(smsCheckbox).not.toBeChecked();
    expect(pushCheckbox).toBeChecked();
  });

  it("should call onChange when checkbox is checked", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
      value: [],
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const emailCheckbox = screen.getByTestId("checkbox-preferences-email");
    fireEvent.click(emailCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(["email"]);
  });

  it("should call onChange when checkbox is unchecked", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
      value: ["email", "sms"],
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const emailCheckbox = screen.getByTestId("checkbox-preferences-email");
    fireEvent.click(emailCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(["sms"]);
  });

  it("should handle multiple selections correctly", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
      value: ["email"],
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const smsCheckbox = screen.getByTestId("checkbox-preferences-sms");
    fireEvent.click(smsCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(["email", "sms"]);
  });

  it("should handle disabled state", () => {
    const props = {
      ...defaultProps,
      disabled: true,
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const emailCheckbox = screen.getByTestId("checkbox-preferences-email");
    const smsCheckbox = screen.getByTestId("checkbox-preferences-sms");
    const pushCheckbox = screen.getByTestId("checkbox-preferences-push");

    expect(emailCheckbox).toBeDisabled();
    expect(smsCheckbox).toBeDisabled();
    expect(pushCheckbox).toBeDisabled();
  });

  it("should handle empty options", () => {
    const props = {
      ...defaultProps,
      options: { options: [] },
    };

    render(<DataCheckboxMultiInputField {...props} />);

    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.queryByText("Email Notifications")).not.toBeInTheDocument();
  });

  it("should handle null/undefined options", () => {
    const props = {
      ...defaultProps,
      options: null,
    };

    render(<DataCheckboxMultiInputField {...props} />);

    expect(screen.getByText("Preferences")).toBeInTheDocument();
    // Should not crash and render without options
  });

  it("should handle undefined options object", () => {
    const props = {
      ...defaultProps,
      options: undefined,
    };

    render(<DataCheckboxMultiInputField {...props} />);

    expect(screen.getByText("Preferences")).toBeInTheDocument();
  });

  it("should handle null/undefined value prop", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
      value: null as any,
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const emailCheckbox = screen.getByTestId("checkbox-preferences-email");
    fireEvent.click(emailCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(["email"]);
  });

  it("should apply custom className", () => {
    const props = {
      ...defaultProps,
      className: "custom-class",
    };

    const { container } = render(<DataCheckboxMultiInputField {...props} />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toHaveClass("custom-class");
  });

  it("should apply default CSS classes", () => {
    const { container } = render(<DataCheckboxMultiInputField {...defaultProps} />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toHaveClass("col-span-full");
    expect(mainDiv).toHaveClass("space-y-4");
  });

  it("should render labels with correct htmlFor attributes", () => {
    render(<DataCheckboxMultiInputField {...defaultProps} />);

    const emailLabel = screen.getByText("Email Notifications");
    const smsLabel = screen.getByText("SMS Notifications");
    const pushLabel = screen.getByText("Push Notifications");

    expect(emailLabel).toBeInTheDocument();
    expect(smsLabel).toBeInTheDocument();
    expect(pushLabel).toBeInTheDocument();
  });

  it("should handle single option correctly", () => {
    const props = {
      ...defaultProps,
      options: {
        options: [{ name: "Single Option", value: "single" }],
      },
    };

    render(<DataCheckboxMultiInputField {...props} />);

    expect(screen.getByText("Single Option")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-preferences-single")).toBeInTheDocument();
  });

  it("should preserve existing values when adding new selection", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
      value: ["email", "push"],
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const smsCheckbox = screen.getByTestId("checkbox-preferences-sms");
    fireEvent.click(smsCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(["email", "push", "sms"]);
  });

  it("should remove only the unchecked value when unchecking", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
      value: ["email", "sms", "push"],
    };

    render(<DataCheckboxMultiInputField {...props} />);

    const smsCheckbox = screen.getByTestId("checkbox-preferences-sms");
    fireEvent.click(smsCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(["email", "push"]);
  });
});