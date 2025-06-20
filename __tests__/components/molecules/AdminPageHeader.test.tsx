import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("AdminPageHeader", () => {
  const defaultProps = {
    breadcrumbLinks: [
      { href: "/", label: "Home" },
      { href: "/admin", label: "Admin" },
    ],
    title: "Test Page",
  };

  it("should render breadcrumb links correctly", () => {
    render(<AdminPageHeader {...defaultProps} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });

  it("should render title correctly", () => {
    render(<AdminPageHeader {...defaultProps} />);

    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Test Page");
  });

  it("should render breadcrumb separator for non-first items", () => {
    const { container } = render(<AdminPageHeader {...defaultProps} />);

    // There should be one separator (between Home and Admin)
    const separators = container.querySelectorAll("svg");
    expect(separators).toHaveLength(1);
  });

  it("should render with single breadcrumb link", () => {
    const props = {
      ...defaultProps,
      breadcrumbLinks: [{ href: "/", label: "Home" }],
    };

    const { container } = render(<AdminPageHeader {...props} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    // No separator should be present for single item
    const separators = container.querySelectorAll("svg");
    expect(separators).toHaveLength(0);
  });

  it("should render multiple breadcrumb links with separators", () => {
    const props = {
      ...defaultProps,
      breadcrumbLinks: [
        { href: "/", label: "Home" },
        { href: "/admin", label: "Admin" },
        { href: "/admin/users", label: "Users" },
      ],
    };

    const { container } = render(<AdminPageHeader {...props} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    
    // Two separators should be present
    const separators = container.querySelectorAll("svg");
    expect(separators).toHaveLength(2);
  });

  it("should not render buttons section when no buttons provided", () => {
    const { container } = render(<AdminPageHeader {...defaultProps} />);

    const buttonsContainer = container.querySelector(".mt-4.sm\\:ml-16");
    expect(buttonsContainer).not.toBeInTheDocument();
  });

  it("should not render buttons section when empty buttons array provided", () => {
    const props = {
      ...defaultProps,
      buttons: [],
    };

    const { container } = render(<AdminPageHeader {...props} />);

    const buttonsContainer = container.querySelector(".mt-4.sm\\:ml-16");
    expect(buttonsContainer).not.toBeInTheDocument();
  });

  it("should render link button correctly", () => {
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/admin/create",
          label: "Create New",
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    const linkButton = screen.getByText("Create New").closest("a");
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("href", "/admin/create");
    // Link button rendered successfully
  });

  it("should render action button correctly", () => {
    const mockAction = jest.fn();
    const props = {
      ...defaultProps,
      buttons: [
        {
          label: "Save",
          action: mockAction,
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    const actionButton = screen.getByText("Save");
    expect(actionButton).toBeInTheDocument();
  });

  it("should render button with danger variant", () => {
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/admin/delete",
          label: "Delete",
          variant: "danger" as const,
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    const dangerButton = screen.getByText("Delete").closest("a");
    expect(dangerButton).toBeInTheDocument();
  });

  it("should render button with primary variant", () => {
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/admin/save",
          label: "Save",
          variant: "primary" as const,
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    const primaryButton = screen.getByText("Save").closest("a");
    expect(primaryButton).toBeInTheDocument();
  });

  it("should render button with icon", () => {
    const TestIcon = <span data-testid="test-icon">📝</span>;
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/admin/edit",
          label: "Edit",
          icon: TestIcon,
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("should render multiple buttons", () => {
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/admin/create",
          label: "Create",
        },
        {
          href: "/admin/edit",
          label: "Edit",
          variant: "primary" as const,
        },
        {
          href: "/admin/delete",
          label: "Delete",
          variant: "danger" as const,
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();

    const createButton = screen.getByText("Create").closest("a");
    const editButton = screen.getByText("Edit").closest("a");
    const deleteButton = screen.getByText("Delete").closest("a");

    expect(createButton).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  it("should render mixed link and action buttons", () => {
    const mockAction = jest.fn();
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/admin/view",
          label: "View",
        },
        {
          label: "Save",
          action: mockAction,
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    const linkButton = screen.getByText("View").closest("a");
    const actionButton = screen.getByText("Save");

    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("href", "/admin/view");
    
    expect(actionButton).toBeInTheDocument();
  });

  it("should wrap action buttons in form elements", () => {
    const mockAction = jest.fn();
    const props = {
      ...defaultProps,
      buttons: [
        {
          label: "Submit",
          action: mockAction,
        },
      ],
    };

    render(<AdminPageHeader {...props} />);

    const form = screen.getByText("Submit").closest("form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("action");
  });

  it("should handle empty breadcrumb links array", () => {
    const props = {
      ...defaultProps,
      breadcrumbLinks: [],
    };

    render(<AdminPageHeader {...props} />);

    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    expect(screen.getByText("Test Page")).toBeInTheDocument();
  });

  it("should apply correct CSS classes for responsive design", () => {
    const { container } = render(<AdminPageHeader {...defaultProps} />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("sm:flex", "sm:items-center", "pb-6");

    const titleContainer = container.querySelector(".sm\\:flex-auto");
    expect(titleContainer).toBeInTheDocument();
  });
});