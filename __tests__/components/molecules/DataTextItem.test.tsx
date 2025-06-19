import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataTextItem from "@/components/molecules/DataTextItem";

// Mock the css utility
jest.mock("@/libraries/css", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

describe("DataTextItem", () => {
  const defaultProps = {
    record: {},
    name: "Description",
    columnKey: "description",
  };

  it("should render text value from record", () => {
    const props = {
      ...defaultProps,
      record: { description: "This is a description" },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("should render empty string for undefined value", () => {
    const props = {
      ...defaultProps,
      record: {},
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("");
  });

  it("should render empty string for null value", () => {
    const props = {
      ...defaultProps,
      record: { description: null },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("");
  });

  it("should convert non-string values to string", () => {
    const props = {
      ...defaultProps,
      record: { description: 12345 },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("12345");
  });

  it("should handle boolean values", () => {
    const props = {
      ...defaultProps,
      record: { description: true },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("");
  });

  it("should handle array values", () => {
    const props = {
      ...defaultProps,
      record: { description: [1, 2, 3] },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("123");
  });

  it("should handle string conversion of non-string values", () => {
    const props = {
      ...defaultProps,
      record: { description: false },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("");
  });

  it("should apply default className when no className provided", () => {
    const props = {
      ...defaultProps,
      record: { description: "test" },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass("text-gray-900");
    expect(element).toHaveClass("whitespace-normal");
    expect(element).toHaveClass("break-words");
    expect(element).toHaveClass("max-w-xs");
  });

  it("should apply custom className when provided", () => {
    const props = {
      ...defaultProps,
      record: { description: "test" },
      className: "custom-class",
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass("custom-class");
  });

  it("should handle different column keys correctly", () => {
    const props = {
      ...defaultProps,
      columnKey: "title",
      record: { title: "Test Title", description: "Test Description" },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
  });

  it("should handle options parameter (even though not used in implementation)", () => {
    const props = {
      ...defaultProps,
      record: { description: "test" },
      options: { someOption: "value" },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("should handle complex record objects", () => {
    const props = {
      ...defaultProps,
      record: {
        id: 1,
        title: "Test Item",
        description: "Item description",
        metadata: {
          created: "2023-01-01",
        },
      },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText("Item description")).toBeInTheDocument();
  });

  it("should render as a div element", () => {
    const props = {
      ...defaultProps,
      record: { description: "test" },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild;

    expect(element?.nodeName).toBe("DIV");
  });

  it("should handle zero value", () => {
    const props = {
      ...defaultProps,
      record: { description: 0 },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("");
  });

  it("should handle empty string value", () => {
    const props = {
      ...defaultProps,
      record: { description: "" },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("");
  });

  it("should handle whitespace-only values", () => {
    const props = {
      ...defaultProps,
      record: { description: "   " },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    // Check that element contains whitespace using getComputedTextContent
    expect(element.textContent).toBe("   ");
  });

  it("should handle special characters", () => {
    const props = {
      ...defaultProps,
      record: { description: "Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?" },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText("Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?")).toBeInTheDocument();
  });

  it("should handle unicode characters", () => {
    const props = {
      ...defaultProps,
      record: { description: "日本語テキスト 🚀 emoji" },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText("日本語テキスト 🚀 emoji")).toBeInTheDocument();
  });

  it("should handle very long text", () => {
    const longText = "a".repeat(1000);
    const props = {
      ...defaultProps,
      record: { description: longText },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("should handle newlines in text", () => {
    const props = {
      ...defaultProps,
      record: { description: "Line 1\nLine 2\nLine 3" },
    };

    render(<DataTextItem {...props} />);

    expect(screen.getByText("Line 1 Line 2 Line 3")).toBeInTheDocument();
  });

  it("should handle undefined record", () => {
    const props = {
      ...defaultProps,
      record: undefined as any,
    };

    expect(() => render(<DataTextItem {...props} />)).toThrow();
  });

  it("should handle nested object access failure gracefully", () => {
    const props = {
      ...defaultProps,
      columnKey: "nested.property.that.does.not.exist",
      record: { other: "value" },
    };

    const { container } = render(<DataTextItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveTextContent("");
  });
});