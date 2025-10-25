import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import HeaderUserMenu from "@/components/molecules/HeaderUserMenu";
import { useAuthSession } from "@/hooks/useAuthSession";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  LogOut: () => <div data-testid="logout-icon">Logout Icon</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">Chevron Down</div>,
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock UserModel with all required fields
const mockUser = {
  id: "user-123",
  name: "John Doe",
  email: "john@example.com",
  password: "hashed-password",
  permissions: ["read", "write"],
  avatarKey: undefined,
  isActive: true,
  emailVerified: true,
  language: "en",
};

describe("HeaderUserMenu", () => {
  const mockOnSignOut = jest.fn();
  const mockUseAuthSession = useAuthSession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockUseAuthSession.mockReturnValue({
      session: null,
      user: null,
      permissions: [],
      accessToken: undefined,
      isPending: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("should render user menu when user is signed in", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByTestId("user-icon")).toBeInTheDocument();
  });

  it("should render menu even when user is null", () => {
    const { container } = render(<HeaderUserMenu signInUser={null} onSignOut={mockOnSignOut} />);

    expect(container.firstChild).not.toBeNull();
    expect(screen.getByTestId("user-menu-button")).toBeInTheDocument();
  });

  it("should toggle menu visibility when button is clicked", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    
    // Menu should be hidden initially
    expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();
    
    // Click to open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("settings-button")).toBeInTheDocument();
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
    
    // Click to close menu
    fireEvent.click(menuButton);
    expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();
  });

  it("should close menu when clicking outside", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();
  });

  it("should not close menu when clicking inside", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
    
    // Click inside menu
    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.mouseDown(settingsButton);
    
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
  });

  it("should call onSignOut when sign out is clicked", async () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);
    
    const signOutButton = screen.getByTestId("logout-button");
    fireEvent.click(signOutButton);
    
    expect(mockOnSignOut).toHaveBeenCalledTimes(1);
  });

  it("should render settings button with correct aria-label", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);
    
    const settingsButton = screen.getByRole("button", { name: "Settings" });
    expect(settingsButton).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  });

  it("should render sign out button with correct aria-label and logout icon", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);
    
    const signOutButton = screen.getByRole("button", { name: "Sign out" });
    expect(signOutButton).toBeInTheDocument();
    expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
  });

  it("should apply correct CSS classes", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    expect(menuButton).toHaveClass("flex", "items-center", "gap-2", "p-2", "rounded-full", "hover:bg-gray-100");
  });

  it("should show dropdown menu with correct styling when open", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);
    
    const dropdown = screen.getByTestId("user-menu-dropdown");
    expect(dropdown).toHaveClass("absolute", "right-0", "mt-2", "w-48", "bg-white", "rounded-md", "shadow-lg", "py-1", "border");
  });

  it("should display permissions from session hook when available", () => {
    mockUseAuthSession.mockReturnValue({
      session: {
        permissions: ["admin", "editor"],
      },
      user: {
        name: "Jane",
        permissions: ["viewer"],
      },
      permissions: ["admin", "editor"],
      accessToken: "token",
      isPending: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);

    expect(screen.getByTestId("user-permissions")).toHaveTextContent(
      "admin, editor"
    );
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

    render(<HeaderUserMenu signInUser={userWithEmptyName} onSignOut={mockOnSignOut} />);

    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });



  it("should handle rapid menu toggle clicks", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    
    // Rapid clicks
    fireEvent.click(menuButton);
    fireEvent.click(menuButton);
    fireEvent.click(menuButton);
    
    // Menu should be open (odd number of clicks)
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
  });

  it("should cleanup event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
    
    const { unmount } = render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
  });

  it("should prevent menu from closing when clicking on menu items", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);
    
    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.mouseDown(settingsButton);
    
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
  });

  it("should navigate to settings when settings button is clicked", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);
    
    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);
    
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("should have proper accessibility attributes", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    const menuButton = screen.getByTestId("user-menu-button");
    expect(menuButton).toHaveAttribute("aria-label", "User menu");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    
    // Open menu and check aria-expanded
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it("should test functionality using aria-labels for better accessibility", () => {
    render(<HeaderUserMenu signInUser={mockUser} onSignOut={mockOnSignOut} />);

    // Test main menu button
    const menuButton = screen.getByRole("button", { name: "User menu" });
    fireEvent.click(menuButton);
    
    // Test settings functionality using aria-label
    const settingsButton = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsButton);
    expect(mockPush).toHaveBeenCalledWith("/settings");
    
    // Reopen menu for logout test
    fireEvent.click(menuButton);
    
    // Test logout functionality using aria-label
    const logoutButton = screen.getByRole("button", { name: "Sign out" });
    fireEvent.click(logoutButton);
    expect(mockOnSignOut).toHaveBeenCalled();
  });
});
jest.mock("@/hooks/useAuthSession", () => ({
  useAuthSession: jest.fn(() => ({
    session: null,
    user: null,
    permissions: [],
    accessToken: undefined,
    isPending: false,
    error: null,
    refetch: jest.fn(),
  })),
}));
