import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import AdminSidebar from "@/components/organisms/AdminSidebar";
import { SidebarProvider } from "@/components/atoms/sidebar";
import { Users, Settings, Home, BarChart2, CheckCircle } from "lucide-react";

// next-intlモック
const mockTranslation = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    "Menu.Admin.administration": "Administration",
    "Common.settings": "Settings",
    "Common.signout": "Sign Out",
  };
  return translations[key] || key;
});

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => mockTranslation),
}));

// next/navigationモック
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

// lucide-reactアイコンのモック
jest.mock("lucide-react", () => ({
  Users: () => <div data-testid="users-icon">Users Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  Home: () => <div data-testid="home-icon">Home Icon</div>,
  BarChart2: () => <div data-testid="barchart2-icon">BarChart2 Icon</div>,
  CheckCircle: () => <div data-testid="checkcircle-icon">CheckCircle Icon</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut Icon</div>,
}));

describe("AdminSidebar", () => {
  const mockMenuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Dashboard",
      href: "/admin/dashboard",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Users",
      href: "/admin/users",
    },
    {
      icon: <BarChart2 className="w-5 h-5" />,
      label: "Statistics",
      href: "/admin/statistics",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      href: "/admin/settings",
    },
  ];

  const mockUser = {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    password: "hashed_password",
    permissions: ["admin"],
    isActive: true,
    emailVerified: true,
  };

  const defaultProps = {
    menuItems: mockMenuItems,
    title: "Admin Panel",
    icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
    signInUser: mockUser,
    onSignOut: jest.fn(),
  };

  const renderWithProvider = (props = {}) => {
    return render(
      <SidebarProvider>
        <AdminSidebar {...defaultProps} {...props} />
      </SidebarProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render sidebar with required elements", () => {
      renderWithProvider();

      expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("admin-sidebar-header")).toBeInTheDocument();
      expect(screen.getByTestId("admin-sidebar-content")).toBeInTheDocument();
      expect(screen.getByTestId("admin-sidebar-footer")).toBeInTheDocument();
    });

    it("should render title and icon", () => {
      renderWithProvider();

      expect(screen.getByTestId("admin-sidebar-title-text")).toHaveTextContent("Admin Panel");
      expect(screen.getByTestId("admin-sidebar-icon")).toBeInTheDocument();
      expect(screen.getByTestId("checkcircle-icon")).toBeInTheDocument();
    });

    it("should render title without icon when icon is not provided", () => {
      renderWithProvider({ icon: undefined });

      expect(screen.getByTestId("admin-sidebar-title-text")).toHaveTextContent("Admin Panel");
      expect(screen.queryByTestId("admin-sidebar-icon")).not.toBeInTheDocument();
    });

    it("should render all menu items", () => {
      renderWithProvider();

      mockMenuItems.forEach((item) => {
        const menuKey = item.href.split('/').pop();
        expect(screen.getByTestId(`admin-menu-item-${menuKey}`)).toBeInTheDocument();
        expect(screen.getByTestId(`admin-menu-label-${menuKey}`)).toHaveTextContent(item.label);
      });
    });

    it("should render menu icons", () => {
      renderWithProvider();

      expect(screen.getByTestId("home-icon")).toBeInTheDocument();
      expect(screen.getByTestId("users-icon")).toBeInTheDocument();
      expect(screen.getByTestId("barchart2-icon")).toBeInTheDocument();
      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    });

    it("should render user information", () => {
      renderWithProvider();

      expect(screen.getByTestId("admin-user-name")).toHaveTextContent("Admin User");
      expect(screen.getByTestId("admin-user-avatar-fallback")).toHaveTextContent("A");
    });

    it("should render default user when signInUser is null", () => {
      renderWithProvider({ signInUser: null });

      expect(screen.getByTestId("admin-user-name")).toHaveTextContent("User");
      expect(screen.getByTestId("admin-user-avatar-fallback")).toHaveTextContent("U");
    });

    it("should handle user with short name", () => {
      renderWithProvider({
        signInUser: {
          id: "2",
          name: "X",
          email: "x@example.com",
          password: "hashed_password",
          permissions: ["admin"],
          isActive: true,
          emailVerified: true,
        },
      });

      expect(screen.getByTestId("admin-user-name")).toHaveTextContent("X");
      expect(screen.getByTestId("admin-user-avatar-fallback")).toHaveTextContent("X");
    });
  });

  describe("Interactions", () => {
    it("should open user dropdown menu when clicked", () => {
      renderWithProvider();

      const userMenuTrigger = screen.getByTestId("admin-user-menu-trigger");
      fireEvent.click(userMenuTrigger);

      expect(screen.getByTestId("admin-user-menu-dropdown")).toBeInTheDocument();
      expect(screen.getByTestId("admin-settings-menu-item")).toBeInTheDocument();
      expect(screen.getByTestId("admin-signout-menu-item")).toBeInTheDocument();
    });

    it("should navigate to settings when settings menu item is clicked", () => {
      renderWithProvider();

      const userMenuTrigger = screen.getByTestId("admin-user-menu-trigger");
      fireEvent.click(userMenuTrigger);

      const settingsMenuItem = screen.getByTestId("admin-settings-menu-item");
      fireEvent.click(settingsMenuItem);

      expect(mockPush).toHaveBeenCalledWith("/admin/settings");
    });

    it("should call onSignOut when signout menu item is clicked", () => {
      const mockOnSignOut = jest.fn();
      renderWithProvider({ onSignOut: mockOnSignOut });

      const userMenuTrigger = screen.getByTestId("admin-user-menu-trigger");
      fireEvent.click(userMenuTrigger);

      const signoutMenuItem = screen.getByTestId("admin-signout-menu-item");
      fireEvent.click(signoutMenuItem);

      expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    });

    it("should have correct href attributes for menu items", () => {
      renderWithProvider();

      mockMenuItems.forEach((item) => {
        const menuKey = item.href.split('/').pop();
        const menuButton = screen.getByTestId(`admin-menu-button-${menuKey}`);
        const link = menuButton.closest('a');
        expect(link).toHaveAttribute('href', item.href);
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper sidebar role", () => {
      renderWithProvider();
      
      // SidebarProviderとSidebarコンポーネント自体のアクセシビリティ機能をテスト
      const sidebar = screen.getByTestId("admin-sidebar");
      expect(sidebar).toBeInTheDocument();
    });

    it("should have proper menu structure", () => {
      renderWithProvider();

      const menu = screen.getByTestId("admin-sidebar-menu");
      expect(menu).toBeInTheDocument();
      
      // メニュー項目が適切な構造を持っているかテスト
      mockMenuItems.forEach((item) => {
        const menuKey = item.href.split('/').pop();
        expect(screen.getByTestId(`admin-menu-item-${menuKey}`)).toBeInTheDocument();
      });
    });

    it("should have proper icon alternatives", () => {
      renderWithProvider();

      // アイコンにdata-testidが設定されていることを確認
      expect(screen.getByTestId("admin-settings-icon")).toBeInTheDocument();
      expect(screen.getByTestId("admin-signout-icon")).toBeInTheDocument();
    });
  });

  describe("States", () => {
    it("should handle empty menu items", () => {
      renderWithProvider({ menuItems: [] });

      expect(screen.getByTestId("admin-sidebar-menu")).toBeInTheDocument();
      // メニューアイテムが存在しないことを確認
      expect(screen.queryByTestId("admin-menu-item-dashboard")).not.toBeInTheDocument();
    });

    it("should handle different title lengths", () => {
      const longTitle = "Very Long Admin Panel Title That Might Wrap";
      renderWithProvider({ title: longTitle });

      expect(screen.getByTestId("admin-sidebar-title-text")).toHaveTextContent(longTitle);
    });

    it("should handle user with no name", () => {
      renderWithProvider({
        signInUser: {
          id: "3",
          name: "",
          email: "noname@example.com",
          password: "hashed_password",
          permissions: ["admin"],
          isActive: true,
          emailVerified: true,
        },
      });

      expect(screen.getByTestId("admin-user-name")).toHaveTextContent("User");
      expect(screen.getByTestId("admin-user-avatar-fallback")).toHaveTextContent("U");
    });
  });

  describe("Translations", () => {
    it("should use translations for menu sections", () => {
      renderWithProvider();

      expect(screen.getByTestId("admin-sidebar-group-label")).toHaveTextContent("Administration");
    });

    it("should use translations for user menu items", () => {
      renderWithProvider();

      const userMenuTrigger = screen.getByTestId("admin-user-menu-trigger");
      fireEvent.click(userMenuTrigger);

      expect(screen.getByTestId("admin-settings-menu-item")).toHaveTextContent("Settings");
      expect(screen.getByTestId("admin-signout-menu-item")).toHaveTextContent("Sign Out");
    });
  });
});
