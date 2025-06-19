import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchForm from "@/components/molecules/SearchForm";

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockPathname = "/test-path";
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe("SearchForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset search params to a fresh instance
    mockSearchParams = new URLSearchParams();
  });

  it("should render search input", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("type", "text");
    expect(searchInput).toHaveAttribute("placeholder", "Search...");
  });

  it("should render with default value", () => {
    render(<SearchForm defaultValue="test query" />);

    const searchInput = screen.getByRole("textbox");
    expect(searchInput).toHaveValue("test query");
  });

  it("should handle search on Enter key press", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "search term" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/test-path?query=search+term");
  });

  it("should handle empty search", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/test-path?");
  });

  it("should reset offset parameter when searching", () => {
    mockSearchParams.set("offset", "20");
    mockSearchParams.set("limit", "10");

    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "new search" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/test-path?limit=10&query=new+search");
  });

  it("should preserve other query parameters", () => {
    mockSearchParams.set("category", "electronics");
    mockSearchParams.set("sort", "price");

    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "laptop" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/test-path?category=electronics&sort=price&query=laptop");
  });

  it("should handle Japanese input composition", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    
    // Start composition
    fireEvent.compositionStart(searchInput);
    fireEvent.change(searchInput, { target: { value: "にほんご" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    // Should not trigger search during composition
    expect(mockPush).not.toHaveBeenCalled();

    // End composition
    fireEvent.compositionEnd(searchInput);
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    // Should trigger search after composition ends
    expect(mockPush).toHaveBeenCalledWith("/test-path?query=%E3%81%AB%E3%81%BB%E3%82%93%E3%81%94");
  });

  it("should ignore non-Enter key presses", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "test" } });
    fireEvent.keyDown(searchInput, { key: "Space", code: "Space" });
    fireEvent.keyDown(searchInput, { key: "Escape", code: "Escape" });
    fireEvent.keyDown(searchInput, { key: "Tab", code: "Tab" });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should update input value on change", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "new value" } });

    expect(searchInput).toHaveValue("new value");
  });

  it("should handle special characters in search", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "test & search" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/test-path?query=test+%26+search");
  });

  it("should handle whitespace-only search as search term", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "   " } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/test-path?query=+++");
  });

  it("should keep search value as is without trimming", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "  search term  " } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/test-path?query=++search+term++");
  });

  it("should apply correct CSS classes", () => {
    const { container } = render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    expect(searchInput).toHaveClass(
      "block",
      "w-full",
      "rounded-md",
      "border-0",
      "px-3",
      "py-1.5",
      "text-gray-900",
      "shadow-sm",
      "ring-1",
      "ring-inset",
      "ring-gray-300",
      "placeholder:text-gray-400",
      "focus:ring-2",
      "focus:ring-inset",
      "focus:ring-indigo-600",
      "sm:text-sm",
      "sm:leading-6"
    );
  });

  it("should render as client component", () => {
    // This test verifies the component renders without server-side issues
    render(<SearchForm />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should handle rapid key presses correctly", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "rapid" } });
    
    // Multiple rapid Enter presses
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    // Should have been called multiple times
    expect(mockPush).toHaveBeenCalledTimes(3);
    expect(mockPush).toHaveBeenCalledWith("/test-path?query=rapid");
  });

  it("should handle long search queries", () => {
    render(<SearchForm />);

    const longQuery = "a".repeat(1000);
    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: longQuery } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith(`/test-path?query=${encodeURIComponent(longQuery)}`);
  });

  it("should handle composition events with different states", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    
    // Test compositionStart -> Enter (should not search)
    fireEvent.compositionStart(searchInput);
    fireEvent.change(searchInput, { target: { value: "comp" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();

    // Test compositionEnd -> Enter (should search)
    fireEvent.compositionEnd(searchInput);
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/test-path?query=comp");
  });

  it("should maintain input focus after search", () => {
    render(<SearchForm />);

    const searchInput = screen.getByRole("textbox");
    searchInput.focus();
    fireEvent.change(searchInput, { target: { value: "test" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    expect(document.activeElement).toBe(searchInput);
  });
});