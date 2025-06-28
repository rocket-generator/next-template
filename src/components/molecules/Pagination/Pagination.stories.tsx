import type { Meta, StoryObj } from "@storybook/nextjs";

// Mock the async component by creating a wrapper
const PaginationWrapper = (props: {
  count: number;
  offset: number;
  limit: number;
  basePath: string;
}) => {
  // Mock the getTranslations function
  const mockTranslations = {
    previous: "前へ",
    next: "次へ",
    first: "最初",
    last: "最後",
    no_result_found: "結果が見つかりませんでした",
  };

  // Create a sync version of the component for Storybook
  const MockPagination = ({
    count,
    offset,
    limit,
    basePath,
  }: {
    count: number;
    offset: number;
    limit: number;
    basePath: string;
  }) => {
    const currentPage = Math.floor((offset ?? 0) / (limit ?? 20)) + 1;
    const totalPages = Math.max(1, Math.ceil(count / (limit ?? 20)));

    const generatePageNumbers = () => {
      const pageNumbers = [];
      const maxVisiblePages = 7;
      let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      return pageNumbers;
    };

    const generateLink = (page: number) => {
      const newOffset = (page - 1) * limit;
      return `${basePath}?offset=${newOffset}&limit=${limit}`;
    };

    const pageNumbers = generatePageNumbers();
    const start = count > 0 ? (offset ?? 0) + 1 : 0;
    const end = Math.min((offset ?? 0) + (limit ?? 20), count);

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <a
            href={generateLink(Math.max(1, currentPage - 1))}
            className={
              "relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50" +
              (currentPage === 1
                ? " pointer-events-none text-gray-400"
                : " text-gray-900")
            }
          >
            {mockTranslations.previous}
          </a>
          <a
            href={generateLink(Math.min(totalPages, currentPage + 1))}
            className={
              "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50" +
              (currentPage === totalPages
                ? " pointer-events-none text-gray-400"
                : " text-gray-900")
            }
          >
            {mockTranslations.next}
          </a>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {count > 0 ? (
                <>
                  <span className="font-medium">{start}</span> -{" "}
                  <span className="font-medium">{end}</span> /{" "}
                  <span className="font-medium">{count}</span>
                </>
              ) : (
                mockTranslations.no_result_found
              )}
            </p>
          </div>
          {count > 0 && (
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                {/* Navigation buttons */}
                <a
                  href={generateLink(1)}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                    currentPage === 1
                      ? "pointer-events-none text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  <span>«</span>
                </a>
                <a
                  href={generateLink(Math.max(1, currentPage - 1))}
                  className={`relative inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                    currentPage === 1
                      ? "pointer-events-none text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  <span>‹</span>
                </a>
                {pageNumbers.map((page) => (
                  <a
                    key={page}
                    href={generateLink(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? "z-10 bg-indigo-600 text-white pointer-events-none"
                        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </a>
                ))}
                <a
                  href={generateLink(Math.min(totalPages, currentPage + 1))}
                  className={`relative inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                    currentPage === totalPages
                      ? "pointer-events-none text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  <span>›</span>
                </a>
                <a
                  href={generateLink(totalPages)}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                    currentPage === totalPages
                      ? "pointer-events-none text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  <span>»</span>
                </a>
              </nav>
            </div>
          )}
        </div>
      </div>
    );
  };

  return <MockPagination {...props} />;
};

const meta: Meta<typeof PaginationWrapper> = {
  title: "Molecules/Pagination",
  component: PaginationWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {
  args: {
    count: 100,
    offset: 0,
    limit: 10,
    basePath: "/admin/users",
  },
};

export const MiddlePage: Story = {
  args: {
    count: 100,
    offset: 30,
    limit: 10,
    basePath: "/admin/users",
  },
};

export const LastPage: Story = {
  args: {
    count: 100,
    offset: 90,
    limit: 10,
    basePath: "/admin/users",
  },
};

export const SinglePage: Story = {
  args: {
    count: 5,
    offset: 0,
    limit: 10,
    basePath: "/admin/users",
  },
};

export const EmptyResults: Story = {
  args: {
    count: 0,
    offset: 0,
    limit: 10,
    basePath: "/admin/users",
  },
};

export const ManyPages: Story = {
  args: {
    count: 500,
    offset: 250,
    limit: 10,
    basePath: "/admin/products",
  },
};

export const LargeLimit: Story = {
  args: {
    count: 100,
    offset: 0,
    limit: 50,
    basePath: "/admin/orders",
  },
};

export const SecondPage: Story = {
  args: {
    count: 45,
    offset: 10,
    limit: 10,
    basePath: "/admin/customers",
  },
};

export const NearEnd: Story = {
  args: {
    count: 23,
    offset: 20,
    limit: 10,
    basePath: "/admin/reports",
  },
};
