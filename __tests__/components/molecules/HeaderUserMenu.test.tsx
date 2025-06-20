import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeaderUserMenu from "@/components/molecules/HeaderUserMenu";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  LogOut: () => <div data-testid="logout-icon">Logout Icon</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">Chevron Down</div>,
}));

// Mock UserModel
const mockUser = {
  id: "user-123",
  name: "John Doe",
  email: "john@example.com",
  permissions: ["read", "write"],
};

describe("HeaderUserMenu", () => {
  const mockOnSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render user menu when user is signed in", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByTestId("user-icon")).toBeInTheDocument();
  });

  it("should render menu even when user is null", () => {
    const { container } = render(<HeaderUserMenu signInUser={null} onSignOut={mockOnSignOut} />);

    expect(container.firstChild).not.toBeNull();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should toggle menu visibility when button is clicked", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    
    // Menu should be hidden initially
    expect(screen.queryByText("設定")).not.toBeInTheDocument();
    
    // Click to open menu
    fireEvent.click(menuButton);
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByText("ログアウト")).toBeInTheDocument();
    
    // Click to close menu
    fireEvent.click(menuButton);
    expect(screen.queryByText("設定")).not.toBeInTheDocument();
  });

  it("should close menu when clicking outside", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByText("設定")).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("設定")).not.toBeInTheDocument();
  });

  it("should not close menu when clicking inside", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByText("設定")).toBeInTheDocument();
    
    // Click inside menu
    const settingsButton = screen.getByText("設定");
    fireEvent.mouseDown(settingsButton);
    
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  it("should call onSignOut when sign out is clicked", async () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    fireEvent.click(menuButton);
    
    const signOutButton = screen.getByText("ログアウト");
    fireEvent.click(signOutButton);
    
    expect(mockOnSignOut).toHaveBeenCalledTimes(1);
  });

  it("should render settings button (currently disabled)", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    fireEvent.click(menuButton);
    
    const settingsButton = screen.getByText("設定");
    expect(settingsButton).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  });

  it("should render sign out button with logout icon", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    fireEvent.click(menuButton);
    
    expect(screen.getByText("ログアウト")).toBeInTheDocument();
    expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
  });

  it("should apply correct CSS classes", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveClass("flex", "items-center", "gap-2", "p-2", "rounded-full", "hover:bg-gray-100");
  });

  it("should show dropdown menu with correct styling when open", () => {
    const { container } = render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    fireEvent.click(menuButton);
    
    const dropdown = container.querySelector(".absolute");
    expect(dropdown).toHaveClass("absolute", "right-0", "mt-2", "w-48", "bg-white", "rounded-md", "shadow-lg", "py-1", "border");
  });

  it("should handle user with different name", () => {
    const differentUser = {
      ...mockUser,
      name: "Jane Smith",
    };

    render(<HeaderUserMenu signInUser={differentUser} onSignOut={mockOnSignOut} />);

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should handle user with empty name", () => {
    const userWithEmptyName = {
      ...mockUser,
      name: "",
    };

    const { container } = render(<HeaderUserMenu signInUser={userWithEmptyName} onSignOut={mockOnSignOut} />);

    const span = container.querySelector("span.text-sm");
    expect(span).toHaveTextContent("");
  });

  it("should use useRef and useEffect for click outside handling", () => {
    const useRefSpy = jest.spyOn(require("react"), "useRef");
    const useEffectSpy = jest.spyOn(require("react"), "useEffect");
    
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    expect(useRefSpy).toHaveBeenCalled();
    expect(useEffectSpy).toHaveBeenCalled();
  });

  it("should manage menu state with useState", () => {
    const useStateSpy = jest.spyOn(require("react"), "useState");
    
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    expect(useStateSpy).toHaveBeenCalled();
  });

  it("should handle rapid menu toggle clicks", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    
    // Rapid clicks
    fireEvent.click(menuButton);
    fireEvent.click(menuButton);
    fireEvent.click(menuButton);
    
    // Menu should be open (odd number of clicks)
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  it("should cleanup event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
    
    const { unmount } = render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
  });

  it("should prevent menu from closing when clicking on menu items", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByRole("button");
    fireEvent.click(menuButton);
    
    const settingsItem = screen.getByText("設定").closest("button");
    fireEvent.mouseDown(settingsItem!);
    
    expect(screen.getByText("設定")).toBeInTheDocument();
  });
});