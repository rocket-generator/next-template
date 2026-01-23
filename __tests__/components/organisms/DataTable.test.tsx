import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import DataTable from "@/components/organisms/DataTable";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

    expect(screen.getByTestId("datatable-header-name")).toHaveClass("text-left");
    expect(screen.getByTestId("datatable-header-age")).toHaveClass("text-right");
    expect(screen.getByTestId("datatable-header-isActive")).toHaveClass("text-center");

    expect(screen.getByTestId("datatable-cell-user-1-name")).toHaveClass("text-left");
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
});
