import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataSelectSingleInputField from "@/components/molecules/DataSelectSingleInputField";

// Mock the css utility
jest.mock("@/libraries/css", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

// Mock Radix UI Select components
jest.mock("@/components/atoms/select", () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => {
    return (
      <div data-testid="select-root">
        {children}
        <select
          value={value || ""}
          onChange={(e) => onValueChange?.(e.target.value)}
          disabled={disabled}
          data-testid="select-input"
          style={{display: 'none'}}
        >
          <option value="">Select an option</option>
          <option value="tech">Technology</option>
          <option value="science">Science</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
      </div>
    );
  },
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`} data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, id, className }: any) => <button data-testid="select-trigger" id={id} className={className}>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
}));

// Mock the Label component
jest.mock("@/components/atoms/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

describe("DataSelectSingleInputField", () => {
  const defaultProps = {
    name: "Category",
    data_key: "category",
    value: "",
    onChange: jest.fn(),
    options: {
      options: [
        { name: "Technology", value: "tech" },
        { name: "Science", value: "science" },
        { name: "Arts", value: "arts" },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render label and select input", () => {
    render(<DataSelectSingleInputField {...defaultProps} />);

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByTestId("select-root")).toBeInTheDocument();
    expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
  });

  it("should render all options", () => {
    render(<DataSelectSingleInputField {...defaultProps} />);

    expect(screen.getByTestId("select-item-tech")).toBeInTheDocument();
    expect(screen.getByTestId("select-item-science")).toBeInTheDocument();
    expect(screen.getByTestId("select-item-arts")).toBeInTheDocument();
    
    expect(screen.getAllByText("Technology").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Science").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Arts").length).toBeGreaterThan(0);
  });

  it("should show selected value", () => {
    const props = {
      ...defaultProps,
      value: "tech",
    };

    render(<DataSelectSingleInputField {...props} />);

    const selectInput = screen.getByTestId("select-input");
    expect(selectInput).toHaveValue("tech");
  });

  it("should call onChange when value changes", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: mockOnChange,
    };

    render(<DataSelectSingleInputField {...props} />);

    const selectInput = screen.getByTestId("select-input");
    fireEvent.change(selectInput, { target: { value: "science" } });

    expect(mockOnChange).toHaveBeenCalledWith("science");
  });

  it("should handle disabled state", () => {
    const props = {
      ...defaultProps,
      disabled: true,
    };

    render(<DataSelectSingleInputField {...props} />);

    const selectInput = screen.getByTestId("select-input");
    expect(selectInput).toBeDisabled();
  });

  it("should handle empty options", () => {
    const props = {
      ...defaultProps,
      options: { options: [] },
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByTestId("select-root")).toBeInTheDocument();
    
    // Should have select-content but no select-items
    expect(screen.getByTestId("select-content")).toBeInTheDocument();
    expect(screen.queryByTestId(/select-item-/)).not.toBeInTheDocument();
  });

  it("should handle null/undefined options", () => {
    const props = {
      ...defaultProps,
      options: null,
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByTestId("select-input")).toBeInTheDocument();
  });

  it("should handle undefined options.options", () => {
    const props = {
      ...defaultProps,
      options: {}, // options.options is undefined
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByTestId("select-input")).toBeInTheDocument();
    // Should render without options (empty select)
    expect(screen.queryByTestId("select-item-tech")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const props = {
      ...defaultProps,
      className: "custom-class",
    };

    render(<DataSelectSingleInputField {...props} />);
    const selectTrigger = screen.getByTestId("select-trigger");

    expect(selectTrigger).toHaveClass("custom-class");
  });

  it("should apply default CSS classes", () => {
    const { container } = render(<DataSelectSingleInputField {...defaultProps} />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toHaveClass("col-span-full");
    expect(mainDiv).toHaveClass("space-y-2");
  });

  it("should show placeholder when no value selected", () => {
    const props = {
      ...defaultProps,
      placeholder: "Choose a category",
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getByText("Choose a category")).toBeInTheDocument();
  });

  it("should handle required prop", () => {
    const props = {
      ...defaultProps,
      required: true,
    };

    render(<DataSelectSingleInputField {...props} />);

    // Note: Required handling would depend on the actual Select component implementation
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("should handle single option correctly", () => {
    const props = {
      ...defaultProps,
      options: {
        options: [{ name: "Only Option", value: "only" }],
      },
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getByText("Only Option")).toBeInTheDocument();
    expect(screen.getByTestId("select-item-only")).toBeInTheDocument();
  });

  it("should handle options with special characters", () => {
    const props = {
      ...defaultProps,
      options: {
        options: [
          { name: "Option with & symbol", value: "special" },
          { name: "日本語オプション", value: "japanese" },
        ],
      },
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getByTestId("select-item-special")).toBeInTheDocument();
    expect(screen.getByTestId("select-item-japanese")).toBeInTheDocument();
  });

  it("should handle options with same names but different values", () => {
    const props = {
      ...defaultProps,
      options: {
        options: [
          { name: "Duplicate", value: "first" },
          { name: "Duplicate", value: "second" },
        ],
      },
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getAllByText("Duplicate")).toHaveLength(2);
    expect(screen.getByTestId("select-item-first")).toBeInTheDocument();
    expect(screen.getByTestId("select-item-second")).toBeInTheDocument();
  });

  it("should handle empty string values", () => {
    const props = {
      ...defaultProps,
      options: {
        options: [
          { name: "Empty Value", value: "" },
          { name: "Normal", value: "normal" },
        ],
      },
    };

    render(<DataSelectSingleInputField {...props} />);

    expect(screen.getByText("Empty Value")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("should handle numeric values converted to strings", () => {
    const props = {
      ...defaultProps,
      options: {
        options: [
          { name: "Option 1", value: "1" },
          { name: "Option 2", value: "2" },
        ],
      },
      value: "1",
    };

    render(<DataSelectSingleInputField {...props} />);

    const selectInput = screen.getByTestId("select-input");
    expect(selectInput).toHaveValue("1");
  });
});