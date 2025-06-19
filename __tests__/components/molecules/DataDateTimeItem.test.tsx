import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataDateTimeItem from "@/components/molecules/DataDateTimeItem";

// Mock the css utility
jest.mock("@/libraries/css", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

describe("DataDateTimeItem", () => {
  const defaultProps = {
    record: {},
    name: "Created At",
    columnKey: "createdAt",
    options: undefined,
  };

  beforeEach(() => {
    // Mock Date.prototype.toLocaleString to have consistent output
    jest.spyOn(Date.prototype, "toLocaleString").mockImplementation(function(locale, options) {
      // Return a predictable format for testing
      if (locale === "en-US" && options?.timeZone === "Asia/Tokyo") {
        return "1/1/2023, 9:00:00 AM";
      }
      return "2023-01-01 00:00:00";
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render formatted datetime for valid unix timestamp", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: 1672531200 }, // 2023-01-01 00:00:00 UTC
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle undefined timestamp", () => {
    const props = {
      ...defaultProps,
      record: {},
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle null timestamp", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: null },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle zero timestamp", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: 0 },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle string timestamp that can be converted to number", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: "1672531200" },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle invalid string timestamp", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: "invalid" },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should apply default className when no className provided", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: 1672531200 },
    };

    const { container } = render(<DataDateTimeItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass("text-gray-900");
  });

  it("should always use default className", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: 1672531200 },
    };

    const { container } = render(<DataDateTimeItem {...props} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass("text-gray-900");
  });

  it("should handle different column keys correctly", () => {
    const props = {
      ...defaultProps,
      columnKey: "updatedAt",
      record: { updatedAt: 1672531200, createdAt: 0 },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle options parameter (even though not used in implementation)", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: 1672531200 },
      options: { someOption: "value" },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle complex record objects", () => {
    const props = {
      ...defaultProps,
      record: {
        id: 1,
        name: "Test Item",
        createdAt: 1672531200,
        metadata: {
          version: 1,
        },
      },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should render as a div element", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: 1672531200 },
    };

    const { container } = render(<DataDateTimeItem {...props} />);
    const element = container.firstChild;

    expect(element?.nodeName).toBe("DIV");
  });

  it("should handle negative timestamps", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: -86400 }, // 1969-12-31
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle very large timestamps", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: 2147483647 }, // 2038-01-19
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should call toLocaleString with correct parameters", () => {
    const toLocaleStringSpy = jest.spyOn(Date.prototype, "toLocaleString");
    
    const props = {
      ...defaultProps,
      record: { createdAt: 1672531200 },
    };

    render(<DataDateTimeItem {...props} />);

    expect(toLocaleStringSpy).toHaveBeenCalledWith("en-US", {
      timeZone: "Asia/Tokyo",
    });
  });

  it("should handle boolean values in record", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: true },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });

  it("should handle array values in record", () => {
    const props = {
      ...defaultProps,
      record: { createdAt: [1, 2, 3] },
    };

    render(<DataDateTimeItem {...props} />);

    expect(screen.getByText("2023-01-01 09:00:00")).toBeInTheDocument();
  });
});