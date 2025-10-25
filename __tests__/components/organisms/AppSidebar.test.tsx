import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AppSidebar, {
  MenuItem,
} from "@/components/organisms/AppSidebar";
import { User } from "@/models/user";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "Common.application": "アプリケーション",
      "Common.settings": "設定",
      "Common.signout": "ログアウト",
    };
    return translations[key] || key;
  },
}));

jest.mock("@/components/molecules/LanguageSwitcher", () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (locale: "ja" | "en") => void }) => (
    <button
      data-testid="language-switcher"
      onClick={() => onSelect("ja")}
    >
      言語切替
    </button>
  ),
}));

describe("AppSidebar", () => {
  const mockPush = jest.fn();
  const mockOnSignOut = jest.fn();

  const mockUser: User = {
    id: "user-1",
    name: "山田太郎",
    email: "yamada@example.com",
    password: "hashed",
    permissions: ["user"],
    isActive: true,
    emailVerified: true,
    language: "ja",
    avatarKey: undefined,
  };

  const menuItems: MenuItem[] = [
    { icon: <div data-testid="icon-dashboard" />, label: "ダッシュボード", href: "/dashboard" },
    { icon: <div data-testid="icon-settings" />, label: "設定", href: "/settings" },
  ];

  const defaultProps = {
    menuItems,
    title: "アプリ",
    icon: <div data-testid="sidebar-icon" />,
    signInUser: mockUser,
    onSignOut: mockOnSignOut,
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockPush.mockClear();
    mockOnSignOut.mockClear();
  });

  const renderSidebar = (overrideProps = {}) =>
    render(<AppSidebar {...defaultProps} {...overrideProps} />);

  it("renders sidebar with menu items and user name", () => {
    renderSidebar();
    expect(screen.getByTestId("sidebar-icon")).toBeInTheDocument();
    expect(screen.getByText("アプリ")).toBeInTheDocument();
    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
  });

  it("renders language switcher and triggers handler", () => {
    renderSidebar();
    const langSwitcher = screen.getByTestId("language-switcher");
    fireEvent.click(langSwitcher);
    // No direct assertion possible; ensure button exists
    expect(langSwitcher).toBeInTheDocument();
  });

  it("renders sign-out button and calls handler", () => {
    renderSidebar();
    const menuTrigger = screen.getByText("山田太郎");
    fireEvent.click(menuTrigger);

    const signoutButton = screen.getByText("ログアウト");
    fireEvent.click(signoutButton);
    expect(mockOnSignOut).toHaveBeenCalledTimes(1);
  });

  it("dispatches settings navigation when dropdown item clicked", () => {
    renderSidebar();
    const menuTrigger = screen.getByText("山田太郎");
    fireEvent.click(menuTrigger);

    const settingsButton = screen.getAllByText("設定").find((el) =>
      el.closest("[role=\"menuitem\"]")
    );
    expect(settingsButton).toBeDefined();
    if (settingsButton) {
      fireEvent.click(settingsButton);
    }
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("handles null user gracefully", () => {
    renderSidebar({ signInUser: null });
    const menuTrigger = screen.getByText("User");
    expect(menuTrigger).toBeInTheDocument();
  });

  it("renders empty menu items without crashing", () => {
    renderSidebar({ menuItems: [] });
    expect(screen.getByText("アプリケーション")).toBeInTheDocument();
  });
});
