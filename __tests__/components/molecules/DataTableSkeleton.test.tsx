import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataTableSkeleton from "@/components/molecules/DataTableSkeleton";

// Mock the Skeleton component
jest.mock("@/components/atoms/skeleton", () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className}>
      Loading...
    </div>
  ),
}));

describe("DataTableSkeleton", () => {
  it("should render with default row count", () => {
    render(<DataTableSkeleton columnCount={3} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // Header section (2) + Table header (3) + Body rows (5 * 3) = 20 skeletons total
    expect(skeletons).toHaveLength(20);
  });

  it("should render with custom row count", () => {
    render(<DataTableSkeleton columnCount={4} rowCount={3} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // Header section (2) + Table header (4) + Body rows (3 * 4) = 18 skeletons total
    expect(skeletons).toHaveLength(18);
  });

  it("should render correct number of columns", () => {
    render(<DataTableSkeleton columnCount={5} />);
    
    const skeletons = screen.getAllByTestId("skeleton");
    // Header section (2) + Table header (5) + Body rows (5 * 5) = 32 skeletons total
    expect(skeletons).toHaveLength(32);
  });

  it("should handle single column", () => {
    render(<DataTableSkeleton columnCount={1} rowCount={2} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // Header section (2) + Table header (1) + Body rows (2 * 1) = 5 skeletons total
    expect(skeletons).toHaveLength(5);
  });

  it("should handle zero rows", () => {
    render(<DataTableSkeleton columnCount={3} rowCount={0} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // Header section (2) + Table header (3) + Body rows (0 * 3) = 5 skeletons total
    expect(skeletons).toHaveLength(5);
  });

  it("should apply correct CSS classes", () => {
    const { container } = render(<DataTableSkeleton columnCount={2} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("mx-auto", "max-w-7xl", "text-stone-800");

    const headerGrid = container.querySelector(".grid");
    expect(headerGrid).toHaveClass("grid", "gap-4");

    const bgGray50 = container.querySelector(".bg-gray-50");
    expect(bgGray50).toHaveClass("bg-gray-50", "p-4");
  });

  it("should render header skeletons with correct styling", () => {
    render(<DataTableSkeleton columnCount={2} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // Page header skeletons (first 2) have different styling
    expect(skeletons[0]).toHaveClass("h-8", "w-48", "mb-4");
    expect(skeletons[1]).toHaveClass("h-10", "w-32");
    
    // Table header skeletons should have h-4
    const tableHeaderSkeletons = skeletons.slice(2, 4);
    tableHeaderSkeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("h-4");
    });
  });

  it("should render body skeletons with correct styling", () => {
    render(<DataTableSkeleton columnCount={2} rowCount={1} />);

    const skeletons = screen.getAllByTestId("skeleton");
    const bodySkeletons = skeletons.slice(2); // Skip header skeletons

    bodySkeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("h-4");
    });
  });

  it("should handle large column count", () => {
    render(<DataTableSkeleton columnCount={10} rowCount={1} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // Header section (2) + Table header (10) + Body rows (1 * 10) = 22 skeletons total
    expect(skeletons).toHaveLength(22);
  });

  it("should handle large row count", () => {
    render(<DataTableSkeleton columnCount={2} rowCount={20} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // Header section (2) + Table header (2) + Body rows (20 * 2) = 44 skeletons total
    expect(skeletons).toHaveLength(44);
  });

  it("should use CSS Grid for layout", () => {
    const { container } = render(<DataTableSkeleton columnCount={3} />);

    const headerGrid = container.querySelector(".grid");
    expect(headerGrid).toHaveClass("grid", "gap-4");
  });

  it("should render rows with proper grid layout", () => {
    const { container } = render(<DataTableSkeleton columnCount={4} rowCount={2} />);

    const bodyRows = container.querySelectorAll(".p-4");
    expect(bodyRows).toHaveLength(3); // 1 header + 2 body rows

    // Check grid elements
    const gridElements = container.querySelectorAll(".grid");
    expect(gridElements.length).toBeGreaterThan(0);
    
    gridElements.forEach((grid) => {
      expect(grid).toHaveClass("grid", "gap-4");
    });
  });

  it("should maintain consistent spacing between elements", () => {
    const { container } = render(<DataTableSkeleton columnCount={2} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("mx-auto", "max-w-7xl", "text-stone-800");

    const pxDiv = container.querySelector(".px-4");
    expect(pxDiv).toHaveClass("px-4");
  });

  it("should differentiate header and body styling", () => {
    const { container } = render(<DataTableSkeleton columnCount={2} rowCount={1} />);

    const headerGrid = container.querySelector(".bg-gray-50");
    expect(headerGrid).toHaveClass("bg-gray-50", "p-4");

    const shadowDiv = container.querySelector(".shadow");
    expect(shadowDiv).toHaveClass("shadow", "ring-1", "ring-black", "ring-opacity-5");
  });
});