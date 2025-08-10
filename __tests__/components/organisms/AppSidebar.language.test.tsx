import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AppSidebar from "@/components/organisms/AppSidebar";
import { User } from "@/models/user";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "Common.settings": "Settings",
      "Common.signout": "Sign Out",
      "Common.japanese": "日本語",
      "Common.english": "English",
    };
    return t[`Common.${key}`] || key;
  },
}));

// Mock server actions import to avoid calling server-side code in tests
jest.mock("@/app/(site)/(authorized)/(app)/actions", () => ({
  setLanguageAction: jest.fn(async () => ({ success: true, locale: "en" })),
}));

describe("AppSidebar Language Switcher", () => {
  const baseUser: User = {
    id: "u1",
    email: "u1@example.com",
    password: "",
    name: "User One",
    permissions: [],
    isActive: true,
    emailVerified: true,
    avatarKey: undefined,
    language: "",
  };

  const commonProps = {
    menuItems: [],
    title: "App",
    icon: undefined as React.ReactNode | undefined,
    onSignOut: jest.fn(),
  };

  it("should render language switcher with Japanese when user language is ja", () => {
    const user = { ...baseUser, language: "ja" } as User;
    render(
      <AppSidebar {...commonProps} signInUser={user} />
    );

    const btn = screen.getByTestId("language-switcher-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("日本語");
  });

  it("should render language switcher with English when user language is en", () => {
    const user = { ...baseUser, language: "en" } as User;
    render(
      <AppSidebar {...commonProps} signInUser={user} />
    );

    const btn = screen.getByTestId("language-switcher-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("English");
  });
});


