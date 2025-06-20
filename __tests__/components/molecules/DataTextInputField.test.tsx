import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataTextInputField from "@/components/molecules/DataTextInputField";

// Mock the css utility
jest.mock("@/libraries/css", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

// Mock the Input component
jest.mock("@/components/atoms/input", () => ({
  Input: ({ 
    id, 
    name, 
    type, 
    onChange, 
    value, 
    required, 
    disabled, 
    placeholder,
    className 
  }: any) => (
    <input
      id={id}
      name={name}
      type={type}
      onChange={onChange}
      value={value}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      data-testid={`input-${id}`}
    />
  ),
}));

// Mock the Label component
jest.mock("@/components/atoms/label", () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} data-testid={`label-${htmlFor}`}>{children}</label>
  ),
}));

describe("DataTextInputField", () => {
  const defaultProps = {
    name: "Username",
    data_key: "username",
    type: "text",
    value: "",
    options: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render label and input", () => {
    render(<DataTextInputField {...defaultProps} />);

    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByTestId("input-username")).toBeInTheDocument();
  });

  it("should render with provided value", () => {
    const props = {
      ...defaultProps,
      value: "john_doe",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue("john_doe");
  });

  it("should handle onChange event", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    fireEvent.change(input, { target: { value: "new_value" } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it("should handle undefined onChange gracefully", () => {
    render(<DataTextInputField {...defaultProps} />);

    const input = screen.getByTestId("input-username");
    
    // Should not crash when onChange is not provided
    expect(() => {
      fireEvent.change(input, { target: { value: "test" } });
    }).not.toThrow();
  });

  it("should handle undefined value", () => {
    const props = {
      ...defaultProps,
      value: undefined,
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue("");
  });

  it("should handle numeric value", () => {
    const props = {
      ...defaultProps,
      value: 123,
      type: "number",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue(123);
  });

  it("should handle array value", () => {
    const props = {
      ...defaultProps,
      value: ["item1", "item2"] as readonly string[],
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue("item1,item2");
  });

  it("should pass required prop to input", () => {
    const props = {
      ...defaultProps,
      required: true,
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveAttribute("required");
  });

  it("should pass disabled prop to input", () => {
    const props = {
      ...defaultProps,
      disabled: true,
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toBeDisabled();
  });

  it("should pass placeholder to input", () => {
    const props = {
      ...defaultProps,
      placeholder: "Enter your username",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveAttribute("placeholder", "Enter your username");
  });

  it("should pass type to input", () => {
    const props = {
      ...defaultProps,
      type: "email",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveAttribute("type", "email");
  });

  it("should apply custom className", () => {
    const props = {
      ...defaultProps,
      className: "custom-class",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveClass("custom-class");
  });

  it("should apply default CSS classes", () => {
    const { container } = render(<DataTextInputField {...defaultProps} />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toHaveClass("col-span-full");
    expect(mainDiv).toHaveClass("space-y-1");
  });

  it("should connect label to input with htmlFor", () => {
    render(<DataTextInputField {...defaultProps} />);

    const label = screen.getByTestId("label-username");
    expect(label).toBeInTheDocument();

    const input = screen.getByTestId("input-username");
    expect(input).toHaveAttribute("id", "username");
  });

  it("should handle different input types correctly", () => {
    const types = ["text", "email", "password", "number", "tel", "url"];

    types.forEach((type) => {
      const props = {
        ...defaultProps,
        type,
        data_key: `test_${type}`,
      };

      const { container } = render(<DataTextInputField {...props} />);
      const input = container.querySelector(`[data-testid="input-test_${type}"]`);
      
      expect(input).toHaveAttribute("type", type);
      
      // Cleanup for next iteration
      container.remove();
    });
  });

  it("should handle empty string value", () => {
    const props = {
      ...defaultProps,
      value: "",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue("");
  });

  it("should handle null value", () => {
    const props = {
      ...defaultProps,
      value: null as any,
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue("");
  });

  it("should handle options parameter (even though not used)", () => {
    const props = {
      ...defaultProps,
      options: { someOption: "value" },
    };

    render(<DataTextInputField {...props} />);

    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByTestId("input-username")).toBeInTheDocument();
  });

  it("should use data_key for input id and name", () => {
    const props = {
      ...defaultProps,
      data_key: "custom_key",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-custom_key");
    expect(input).toHaveAttribute("id", "custom_key");
    expect(input).toHaveAttribute("name", "custom_key");
  });

  it("should handle special characters in value", () => {
    const props = {
      ...defaultProps,
      value: "特殊文字!@#$%^&*()",
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue("特殊文字!@#$%^&*()");
  });

  it("should handle very long values", () => {
    const longValue = "a".repeat(1000);
    const props = {
      ...defaultProps,
      value: longValue,
    };

    render(<DataTextInputField {...props} />);

    const input = screen.getByTestId("input-username");
    expect(input).toHaveValue(longValue);
  });
});