import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/organisms/AppSidebar";
import { User } from "@/models/user";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "Common.settings": "設定",
      "Common.signout": "ログアウト",
    };
    return translations[key] || key;
  },
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe("AppSidebar", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
  });

  const mockUser: User = {
    id: "user-1",
    name: "山田太郎",
    email: "yamada@example.com",
    password: "hashedpassword",
    permissions: ["user"],
    isActive: true,
    emailVerified: true,
    avatarKey: undefined,
  };

  const mockMenuItems = [
    {
      icon: <div data-testid="dashboard-icon" className="w-5 h-5 bg-blue-500 rounded" />,
      label: "ダッシュボード",
      href: "/dashboard",
    },
    {
      icon: <div data-testid="settings-icon" className="w-5 h-5 bg-green-500 rounded" />,
      label: "設定",
      href: "/settings",
    },
  ];

  it("renders sidebar with user information", () => {
    render(<AppSidebar user={mockUser} menuItems={mockMenuItems} />);

    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("yamada@example.com")).toBeInTheDocument();
  });

  it("renders menu items", () => {
    render(<AppSidebar user={mockUser} menuItems={mockMenuItems} />);

    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-icon")).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  });

  it("navigates when menu item is clicked", () => {
    render(<AppSidebar user={mockUser} menuItems={mockMenuItems} />);

    const dashboardButton = screen.getByText("ダッシュボード");
    fireEvent.click(dashboardButton);

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("renders user menu in footer", () => {
    render(<AppSidebar user={mockUser} menuItems={mockMenuItems} />);

    // Check if user menu is rendered in footer
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByText("ログアウト")).toBeInTheDocument();
  });

  it("handles user without avatar", () => {
    const userWithoutAvatar = { ...mockUser, avatarKey: undefined };
    render(<AppSidebar user={userWithoutAvatar} menuItems={mockMenuItems} />);

    // Should render avatar fallback
    expect(screen.getByText("山")).toBeInTheDocument();
  });

  it("handles user with avatar", () => {
    const userWithAvatar = { ...mockUser, avatarKey: "avatar-key" };
    render(<AppSidebar user={userWithAvatar} menuItems={mockMenuItems} />);

    // Should render avatar image
    const avatar = screen.getByAltText("山田太郎");
    expect(avatar).toBeInTheDocument();
  });

  it("handles empty menu items", () => {
    render(<AppSidebar user={mockUser} menuItems={[]} />);

    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("yamada@example.com")).toBeInTheDocument();
  });

  it("handles null user", () => {
    render(<AppSidebar user={null} menuItems={mockMenuItems} />);

    // Should not render user information
    expect(screen.queryByText("山田太郎")).not.toBeInTheDocument();
    expect(screen.queryByText("yamada@example.com")).not.toBeInTheDocument();
  });

  it("renders sidebar with correct structure", () => {
    render(<AppSidebar user={mockUser} menuItems={mockMenuItems} />);

    // Check if sidebar structure is correct
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });
}); 