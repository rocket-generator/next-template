import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type {
  AnchorHTMLAttributes,
  PropsWithChildren,
} from "react";
import DataTable from "@/components/organisms/DataTable";

const mockPush = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>> & {
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/components/molecules/SearchForm", () => ({
  __esModule: true,
  default: () => <div data-testid="search-form" />,
}));

jest.mock("@/components/molecules/Pagination", () => ({
  __esModule: true,
  default: () => <div data-testid="pagination" />,
}));

describe("DataTable", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  const structure = [
    { name: "Name", key: "name", type: "text", options: {}, isSortable: true },
    { name: "Age", key: "age", type: "number", options: {}, isSortable: true },
    {
      name: "Active",
      key: "isActive",
      type: "boolean",
      options: {},
      isSortable: false,
    },
  ];

  const data = [
    {
      id: "user-1",
      name: "Alice",
      age: 30,
      isActive: true,
    },
  ];

  const baseProps = {
    count: 1,
    offset: 0,
    limit: 20,
    data,
    structure,
    basePath: "/admin/users",
  };

  it("should apply alignment classes based on column type", () => {
    render(<DataTable {...baseProps} />);

    expect(screen.getByTestId("datatable-header-name")).toHaveClass(
      "text-left",
      "sticky",
      "left-0",
      "bg-gray-50",
      "border-b",
      "border-gray-300"
    );
    expect(screen.getByTestId("datatable-header-age")).toHaveClass("text-right");
    expect(screen.getByTestId("datatable-header-isActive")).toHaveClass("text-center");

    expect(screen.getByTestId("datatable-cell-user-1-name")).toHaveClass(
      "text-left",
      "sticky",
      "left-0",
      "bg-white",
      "group-hover:bg-sky-50",
      "group-focus-within:bg-sky-50"
    );
    expect(screen.getByTestId("datatable-cell-user-1-age")).toHaveClass("text-right");
    expect(screen.getByTestId("datatable-cell-user-1-isActive")).toHaveClass("text-center");
  });

  it("should render sort icons with correct colors for sorted and unsorted columns", () => {
    render(<DataTable {...baseProps} order="age" direction="asc" />);

    expect(screen.getByTestId("datatable-sort-up-age")).toHaveClass("text-gray-900");
    expect(screen.getByTestId("datatable-sort-down-age")).toHaveClass("text-gray-400");

    expect(screen.getByTestId("datatable-sort-up-name")).toHaveClass("text-gray-400");
    expect(screen.getByTestId("datatable-sort-down-name")).toHaveClass("text-gray-400");
  });

  it("should keep toolbar and pagination visible after responsive layout changes", () => {
    render(<DataTable {...baseProps} />);

    expect(screen.getByTestId("datatable-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("search-form")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("should keep the table container aligned with the page content while allowing inner horizontal scroll", () => {
    render(<DataTable {...baseProps} />);

    expect(screen.getByTestId("datatable-frame")).toHaveClass(
      "overflow-hidden",
      "border",
      "border-gray-300",
      "shadow"
    );

    expect(screen.getByTestId("datatable-scroll-container")).toHaveClass(
      "overflow-x-auto",
      "scrollbar-hidden"
    );

    expect(screen.getByTestId("datatable-width-wrapper")).toHaveClass(
      "inline-block",
      "min-w-full",
      "align-middle"
    );

    expect(screen.getByRole("table")).toHaveClass(
      "min-w-full",
      "w-max",
      "border-separate",
      "border-spacing-0",
      "divide-y",
      "divide-gray-300"
    );
  });

  it("should navigate to the detail page when a row is clicked and remove action links", () => {
    const { container } = render(<DataTable {...baseProps} />);

    fireEvent.click(screen.getByTestId("datatable-row-user-1"));

    expect(mockPush).toHaveBeenCalledWith("/admin/users/user-1");
    expect(
      container.querySelector('a[href="/admin/users/user-1"]')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('a[href="/admin/users/user-1/edit"]')
    ).not.toBeInTheDocument();
  });

  it("should navigate to the detail page when Enter or Space is pressed on a row", () => {
    render(<DataTable {...baseProps} />);

    const row = screen.getByTestId("datatable-row-user-1");

    fireEvent.keyDown(row, { key: "Enter" });
    expect(mockPush).toHaveBeenLastCalledWith("/admin/users/user-1");

    fireEvent.keyDown(row, { key: " " });
    expect(mockPush).toHaveBeenLastCalledWith("/admin/users/user-1");
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should prioritize nested link interactions over row navigation", () => {
    render(
      <DataTable
        {...baseProps}
        structure={[
          {
            name: "Name",
            key: "name",
            type: "text",
            options: {},
            isSortable: true,
          },
          {
            name: "Profile",
            key: "profile",
            type: "link",
            options: {
              base_url: "/admin/users/",
              key: "id",
              display: "name",
            },
            isSortable: false,
          },
        ]}
        data={[
          {
            id: "user-1",
            name: "Alice",
            profile: {
              id: "profile-1",
              name: "Open profile",
            },
          },
        ]}
      />
    );

    const nestedLink = screen.getByRole("link", { name: "Open profile" });

    fireEvent.click(nestedLink);

    expect(nestedLink).toHaveAttribute("href", "/admin/users/profile-1");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
