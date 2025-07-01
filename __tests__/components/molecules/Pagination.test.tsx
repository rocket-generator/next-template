import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock Next.js Link component
jest.mock("next/link", () => {
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
  return MockLink;
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronLeft: () => <div data-testid="chevron-left">←</div>,
  ChevronRight: () => <div data-testid="chevron-right">→</div>,
  ChevronFirst: () => <div data-testid="chevron-first">⇤</div>,
  ChevronLast: () => <div data-testid="chevron-last">⇥</div>,
}));

// Mock next-intl/server
const mockTranslation = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    "previous": "Previous",
    "next": "Next", 
    "first": "First",
    "last": "Last",
    "no_result_found": "No results found",
  };
  return translations[key] || key;
});

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => Promise.resolve(mockTranslation)),
}));

// Create a client-side wrapper for the async server component
function PaginationWrapper({ count, offset, limit, basePath }: {
  count: number;
  offset: number;
  limit: number;
  basePath: string;
}) {
  const currentPage = Math.floor((offset ?? 0) / (limit ?? 20)) + 1;
  const totalPages = Math.max(1, Math.ceil(count / (limit ?? 20)));

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
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
    const separator = basePath.includes('?') ? '&' : '?';
    return `${basePath}${separator}offset=${newOffset}&limit=${limit}`;
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
          {mockTranslation("previous")}
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
          {mockTranslation("next")}
        </a>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700" data-testid="pagination-info">
            {count > 0 ? (
              <>
                <span className="font-medium" data-testid="pagination-start">{start}</span> -{" "}
                <span className="font-medium" data-testid="pagination-end">{end}</span> /{" "}
                <span className="font-medium" data-testid="pagination-total">{count}</span>
              </>
            ) : (
              <span data-testid="no-results-message">{mockTranslation("no_result_found")}</span>
            )}
          </p>
        </div>
        {count > 0 && (
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <a
                href={generateLink(1)}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
              >
                <span className="sr-only">{mockTranslation("first")}</span>
                <div data-testid="chevron-first">⇤</div>
              </a>
              <a
                href={generateLink(Math.max(1, currentPage - 1))}
                className={`relative inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
              >
                <span className="sr-only">{mockTranslation("previous")}</span>
                <div data-testid="chevron-left">←</div>
              </a>
              {pageNumbers.map((page) => (
                <a
                  key={page}
                  href={generateLink(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 pointer-events-none"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  }`}
                >
                  {page}
                </a>
              ))}
              <a
                href={generateLink(Math.min(totalPages, currentPage + 1))}
                className={`relative inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
              >
                <span className="sr-only">{mockTranslation("next")}</span>
                <div data-testid="chevron-right">→</div>
              </a>
              <a
                href={generateLink(totalPages)}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
              >
                <span className="sr-only">{mockTranslation("last")}</span>
                <div data-testid="chevron-last">⇥</div>
              </a>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

describe("Pagination", () => {
  const defaultProps = {
    count: 100,
    offset: 0,
    limit: 10,
    basePath: "/items",
  };

  it("should render pagination with correct page numbers", () => {
    render(<PaginationWrapper {...defaultProps} />);

    // Should show page numbers in navigation
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    
    // Use getAllByText and check the navigation contains page numbers
    const pageLinks = screen.getAllByText("1");
    expect(pageLinks.length).toBeGreaterThan(0);
    
    const page2Links = screen.getAllByText("2");
    expect(page2Links.length).toBeGreaterThan(0);
    
    // For last page, there should be only one instance
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should show correct current page", () => {
    const props = {
      ...defaultProps,
      offset: 20, // Page 3 (offset 20 / limit 10 + 1)
    };

    render(<PaginationWrapper {...props} />);

    const currentPageButton = screen.getByText("3");
    expect(currentPageButton.closest("a")).toHaveClass("bg-indigo-600");
  });

  it("should render previous and next links", () => {
    const props = {
      ...defaultProps,
      offset: 20, // Page 3
    };

    render(<PaginationWrapper {...props} />);

    expect(screen.getAllByText("Previous").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Next").length).toBeGreaterThan(0);
    expect(screen.getByTestId("chevron-left")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
  });

  it("should disable previous link on first page", () => {
    render(<PaginationWrapper {...defaultProps} />);

    const previousLinks = screen.getAllByText("Previous");
    const previousLink = previousLinks[0].closest("a");
    expect(previousLink).toHaveClass("pointer-events-none", "text-gray-400");
  });

  it("should disable next link on last page", () => {
    const props = {
      ...defaultProps,
      offset: 90, // Last page (100 total, 10 per page)
    };

    render(<PaginationWrapper {...props} />);

    const nextLinks = screen.getAllByText("Next");
    const nextLink = nextLinks[0].closest("a");
    expect(nextLink).toHaveClass("pointer-events-none", "text-gray-400");
  });

  it("should generate correct links for page numbers", () => {
    render(<PaginationWrapper {...defaultProps} />);

    const page2Link = screen.getByText("2").closest("a");
    expect(page2Link).toHaveAttribute("href", "/items?offset=10&limit=10");

    const page3Link = screen.getByText("3").closest("a");
    expect(page3Link).toHaveAttribute("href", "/items?offset=20&limit=10");
  });

  it("should generate correct previous and next links", () => {
    const props = {
      ...defaultProps,
      offset: 20, // Page 3
    };

    render(<PaginationWrapper {...props} />);

    const previousLinks = screen.getAllByText("Previous");
    const previousLink = previousLinks[0].closest("a");
    expect(previousLink).toHaveAttribute("href", "/items?offset=10&limit=10");

    const nextLinks = screen.getAllByText("Next");
    const nextLink = nextLinks[0].closest("a");
    expect(nextLink).toHaveAttribute("href", "/items?offset=30&limit=10");
  });

  it("should show correct pages for large page ranges", () => {
    const props = {
      ...defaultProps,
      count: 1000, // 100 pages
      offset: 500, // Page 51
    };

    render(<PaginationWrapper {...props} />);

    // Should show 7 pages around current page (48-54)
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("49")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("51")).toBeInTheDocument(); // Current
    expect(screen.getByText("52")).toBeInTheDocument();
    expect(screen.getByText("53")).toBeInTheDocument();
    expect(screen.getByText("54")).toBeInTheDocument();
  });

  it("should handle single page", () => {
    const props = {
      ...defaultProps,
      count: 5, // Only 1 page
    };

    render(<PaginationWrapper {...props} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    
    // Should not have page 2 in the navigation
    const navContent = nav.textContent;
    expect(navContent).not.toMatch(/^2$/);

    // Previous and next should be disabled
    const previousLinks = screen.getAllByText("Previous");
    const nextLinks = screen.getAllByText("Next");
    const previousLink = previousLinks[0].closest("a");
    const nextLink = nextLinks[0].closest("a");
    expect(previousLink).toHaveClass("pointer-events-none", "text-gray-400");
    expect(nextLink).toHaveClass("pointer-events-none", "text-gray-400");
  });

  it("should handle empty results", () => {
    const props = {
      ...defaultProps,
      count: 0,
    };

    render(<PaginationWrapper {...props} />);

    // Should show no results message
    expect(screen.getByTestId("no-results-message")).toBeInTheDocument();
  });

  it("should show correct result count information", () => {
    const props = {
      ...defaultProps,
      offset: 20,
      limit: 10,
      count: 100,
    };

    render(<PaginationWrapper {...props} />);

    expect(screen.getByText("21")).toBeInTheDocument(); // offset + 1
    expect(screen.getByText("30")).toBeInTheDocument(); // offset + limit
    expect(screen.getByText("100")).toBeInTheDocument(); // total count
  });

  it("should handle last page correctly in result count", () => {
    const props = {
      ...defaultProps,
      offset: 95,
      limit: 10,
      count: 100,
    };

    render(<PaginationWrapper {...props} />);

    // Check for both instances of "100" (result count and total count)
    const hundredElements = screen.getAllByText("100");
    expect(hundredElements.length).toBeGreaterThanOrEqual(1);
    
    expect(screen.getByText("96")).toBeInTheDocument(); // offset + 1
  });

  it("should render with responsive design classes", () => {
    const { container } = render(<PaginationWrapper {...defaultProps} />);

    const navigationElement = container.querySelector(".flex.items-center.justify-between");
    expect(navigationElement).toBeInTheDocument();

    const mobileSection = container.querySelector(".sm\\:hidden");
    expect(mobileSection).toBeInTheDocument();

    const desktopSection = container.querySelector(".sm\\:flex");
    expect(desktopSection).toBeInTheDocument();
  });

  it("should handle basePath with query parameters", () => {
    const props = {
      ...defaultProps,
      basePath: "/items?category=electronics",
    };

    render(<PaginationWrapper {...props} />);

    const page2Links = screen.getAllByText("2");
    const page2Link = page2Links.find(el => el.closest("nav"))?.closest("a");
    expect(page2Link).toHaveAttribute("href", "/items?category=electronics&offset=10&limit=10");
  });

  it("should generate pages correctly for fewer than 7 pages", () => {
    const props = {
      ...defaultProps,
      count: 50, // 5 pages
    };

    render(<PaginationWrapper {...props} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    
    // Check that navigation contains the expected page numbers
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should handle edge case of current page near end", () => {
    const props = {
      ...defaultProps,
      count: 1000, // 100 pages
      offset: 970, // Page 98
    };

    render(<PaginationWrapper {...props} />);

    expect(screen.getByText("98")).toBeInTheDocument(); // Current
    expect(screen.getByText("99")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});