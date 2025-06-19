import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AppPageHeader from "@/components/molecules/AppPageHeader";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("AppPageHeader", () => {
  const defaultProps = {
    breadcrumbLinks: [
      { href: "/", label: "Home" },
      { href: "/app", label: "App" },
    ],
    title: "App Page",
  };

  it("should render breadcrumb links correctly", () => {
    render(<AppPageHeader {...defaultProps} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("App")).toBeInTheDocument();
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });

  it("should render title correctly", () => {
    render(<AppPageHeader {...defaultProps} />);

    expect(screen.getByText("App Page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("App Page");
  });

  it("should render breadcrumb separator for non-first items", () => {
    const { container } = render(<AppPageHeader {...defaultProps} />);

    // There should be one separator (between Home and App)
    const separators = container.querySelectorAll("svg");
    expect(separators).toHaveLength(1);
  });

  it("should render with single breadcrumb link", () => {
    const props = {
      ...defaultProps,
      breadcrumbLinks: [{ href: "/", label: "Home" }],
    };

    const { container } = render(<AppPageHeader {...props} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    // No separator should be present for single item
    const separators = container.querySelectorAll("svg");
    expect(separators).toHaveLength(0);
  });

  it("should not render buttons section when no buttons provided", () => {
    const { container } = render(<AppPageHeader {...defaultProps} />);

    const buttonsContainer = container.querySelector(".mt-4.sm\\:ml-16");
    expect(buttonsContainer).not.toBeInTheDocument();
  });

  it("should render link button correctly", () => {
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/app/create",
          label: "Create New",
        },
      ],
    };

    render(<AppPageHeader {...props} />);

    const linkButton = screen.getByText("Create New").closest("a");
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("href", "/app/create");
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

    render(<AppPageHeader {...props} />);

    const actionButton = screen.getByText("Save");
    expect(actionButton).toBeInTheDocument();
  });

  it("should render button with danger variant", () => {
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/app/delete",
          label: "Delete",
          variant: "danger" as const,
        },
      ],
    };

    render(<AppPageHeader {...props} />);

    const dangerButton = screen.getByText("Delete").closest("a");
    expect(dangerButton).toBeInTheDocument();
  });

  it("should render button with icon", () => {
    const TestIcon = <span data-testid="test-icon">📱</span>;
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/app/edit",
          label: "Edit",
          icon: TestIcon,
        },
      ],
    };

    render(<AppPageHeader {...props} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("should render multiple buttons", () => {
    const props = {
      ...defaultProps,
      buttons: [
        {
          href: "/app/create",
          label: "Create",
        },
        {
          href: "/app/edit",
          label: "Edit",
          variant: "primary" as const,
        },
        {
          href: "/app/delete",
          label: "Delete",
          variant: "danger" as const,
        },
      ],
    };

    render(<AppPageHeader {...props} />);

    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should apply correct CSS classes for responsive design", () => {
    const { container } = render(<AppPageHeader {...defaultProps} />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("sm:flex", "sm:items-center", "pb-6");
  });
});