import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataLinkItem from "@/components/molecules/DataLinkItem";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
});

// Mock the css utility
jest.mock("@/libraries/css", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

describe("DataLinkItem", () => {
  const defaultProps = {
    record: {
      user: {
        id: "123",
        name: "John Doe",
      },
    },
    name: "User",
    columnKey: "user",
    options: undefined,
  };

  it("should render link with default options", () => {
    render(<DataLinkItem {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "123");
    expect(link).toHaveTextContent("John Doe");
  });

  it("should handle custom options", () => {
    const props = {
      ...defaultProps,
      options: {
        key: "userId",
        base_url: "/users",
        display: "fullName",
      },
      record: {
        user: {
          userId: "456",
          fullName: "Jane Smith",
        },
      },
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/users456");
    expect(link).toHaveTextContent("Jane Smith");
  });

  it("should handle nested object access with dot notation", () => {
    const props = {
      ...defaultProps,
      columnKey: "user.profile.details",
      record: {
        user: {
          profile: {
            details: {
              id: "nested123",
              name: "Nested User",
            },
          },
        },
      },
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "nested123");
    expect(link).toHaveTextContent("Nested User");
  });

  it("should handle null record value", () => {
    const props = {
      ...defaultProps,
      record: {
        user: null,
      },
    };

    render(<DataLinkItem {...props} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should handle undefined record value", () => {
    const props = {
      ...defaultProps,
      record: {},
    };

    render(<DataLinkItem {...props} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should handle missing nested properties", () => {
    const props = {
      ...defaultProps,
      columnKey: "user.nonexistent.property",
      record: {
        user: {
          id: "123",
          name: "John",
        },
      },
    };

    render(<DataLinkItem {...props} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should apply default className", () => {
    const { container } = render(<DataLinkItem {...defaultProps} />);
    
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("text-blue-600");
    expect(div).toHaveClass("hover:text-blue-800");
    expect(div).toHaveClass("underline");
    expect(div).toHaveClass("hover:no-underline");
    
    const link = container.querySelector("a");
    expect(link).toHaveClass("text-indigo-900", "hover:text-indigo-900");
  });

  it("should apply custom className", () => {
    const props = {
      ...defaultProps,
      className: "custom-link-class",
    };

    const { container } = render(<DataLinkItem {...props} />);
    
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("custom-link-class");
  });

  it("should handle empty string values", () => {
    const props = {
      ...defaultProps,
      record: {
        user: {
          id: "",
          name: "",
        },
      },
    };

    const { container } = render(<DataLinkItem {...props} />);

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "");
    expect(link).toHaveTextContent("");
  });

  it("should handle different data types for key and display", () => {
    const props = {
      ...defaultProps,
      record: {
        user: {
          id: 123, // number
          name: true, // boolean
        },
      },
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "123");
    expect(link).toHaveTextContent("");
  });

  it("should handle complex nested structures", () => {
    const props = {
      ...defaultProps,
      columnKey: "data.items.0.user",
      record: {
        data: {
          items: [
            {
              user: {
                id: "item123",
                name: "Item User",
              },
            },
          ],
        },
      },
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "item123");
    expect(link).toHaveTextContent("Item User");
  });

  it("should handle base_url with trailing slash", () => {
    const props = {
      ...defaultProps,
      options: {
        base_url: "/users/",
      },
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/users/123");
  });

  it("should handle base_url without leading slash", () => {
    const props = {
      ...defaultProps,
      options: {
        base_url: "users",
      },
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "users123");
  });

  it("should handle array access in dot notation", () => {
    const props = {
      ...defaultProps,
      columnKey: "users.0",
      record: {
        users: [
          {
            id: "first",
            name: "First User",
          },
          {
            id: "second", 
            name: "Second User",
          },
        ],
      },
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "first");
    expect(link).toHaveTextContent("First User");
  });

  it("should handle options as null", () => {
    const props = {
      ...defaultProps,
      options: null,
    };

    render(<DataLinkItem {...props} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "123");
    expect(link).toHaveTextContent("John Doe");
  });
});