import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/(site)/(unauthorized)/page";

// Mock Next.js components
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, quality, placeholder, blurDataURL, ...restProps } = props;
    return <img {...restProps} />;
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock Button component
jest.mock("@/components/atoms/button", () => ({
  Button: ({ children, className, size, variant, ...props }: any) => (
    <button
      className={`button ${className || ""} ${size || ""} ${variant || ""}`}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  CheckCircle: (props: any) => (
    <div data-testid="check-circle-icon" {...props} />
  ),
  List: (props: any) => <div data-testid="list-icon" {...props} />,
  Bell: (props: any) => <div data-testid="bell-icon" {...props} />,
  BarChart3: (props: any) => <div data-testid="bar-chart-icon" {...props} />,
  ArrowRight: (props: any) => <div data-testid="arrow-right-icon" {...props} />,
}));

describe("Landing Page", () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  describe("Navigation Bar", () => {
    it("should render the TaskMaster logo", () => {
      const logos = screen.getAllByText("TaskMaster");
      const navLogo = logos.find((logo) => logo.closest("nav"));
      expect(navLogo).toBeInTheDocument();
      expect(navLogo).toHaveClass("text-2xl", "font-bold", "text-blue-600");
    });

    it("should render login link", () => {
      const loginLink = screen.getByRole("link", { name: "ログイン" });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/auth/signin");
    });

    it("should render signup button in navigation", () => {
      const signupButtons = screen.getAllByRole("link", { name: /新規登録/ });
      const navSignupButton = signupButtons.find(
        (button) =>
          button.getAttribute("href") === "/auth/signup" &&
          button.closest("nav")
      );
      expect(navSignupButton).toBeInTheDocument();
    });

    it("should render check circle icon in navigation", () => {
      const checkIcons = screen.getAllByTestId("check-circle-icon");
      const navIcon = checkIcons.find((icon) => icon.closest("nav"));
      expect(navIcon).toBeInTheDocument();
    });
  });

  describe("Hero Section", () => {
    it("should render hero heading", () => {
      const heroHeading = screen.getByText("タスク管理を簡単に、効率的に");
      expect(heroHeading).toBeInTheDocument();
      expect(heroHeading).toHaveClass("text-3xl");
    });

    it("should render hero description", () => {
      const heroDescription = screen.getByText(
        "TaskMasterは、あなたの日々のタスクを簡単に管理し、生産性を向上させるためのツールです。"
      );
      expect(heroDescription).toBeInTheDocument();
    });

    it('should render "無料で始める" button', () => {
      const startButton = screen.getByRole("link", { name: /無料で始める/ });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveAttribute("href", "/auth/signup");
    });

    it("should render hero image", () => {
      const heroImage = screen.getByAltText(
        "TaskMaster dashboard illustration"
      );
      expect(heroImage).toBeInTheDocument();
      expect(heroImage).toHaveAttribute("src", "/images/placeholder.svg");
    });

    it("should render arrow right icon in hero button", () => {
      const arrowIcon = screen.getAllByTestId("arrow-right-icon");
      expect(arrowIcon.length).toBeGreaterThan(0);
    });
  });

  describe("Features Section", () => {
    it("should render features section heading", () => {
      const featuresHeading = screen.getByText("TaskMasterの主な機能");
      expect(featuresHeading).toBeInTheDocument();
    });

    it("should render all feature items", () => {
      const features = [
        "シンプルなタスク管理",
        "プロジェクト管理",
        "リマインダー機能",
        "レポート機能",
      ];

      features.forEach((feature) => {
        const featureHeading = screen.getByText(feature);
        expect(featureHeading).toBeInTheDocument();
      });
    });

    it("should render feature descriptions", () => {
      const descriptions = [
        "直感的なインターフェースで、タスクの追加、編集、完了が簡単に行えます。",
        "タスクをプロジェクトごとに整理し、大きな目標を達成するための進捗を把握できます。",
        "重要なタスクを忘れないよう、リマインダーを設定できます。",
        "タスクの完了状況や生産性のトレンドを可視化し、改善点を見つけられます。",
      ];

      descriptions.forEach((description) => {
        const descriptionText = screen.getByText(description);
        expect(descriptionText).toBeInTheDocument();
      });
    });

    it("should render feature icons", () => {
      const listIcon = screen.getByTestId("list-icon");
      const checkIcon = screen.getAllByTestId("check-circle-icon");
      const bellIcon = screen.getByTestId("bell-icon");
      const barChartIcon = screen.getByTestId("bar-chart-icon");

      expect(listIcon).toBeInTheDocument();
      expect(checkIcon.length).toBeGreaterThan(0);
      expect(bellIcon).toBeInTheDocument();
      expect(barChartIcon).toBeInTheDocument();
    });
  });

  describe("CTA Section", () => {
    it("should render CTA heading", () => {
      const ctaHeading = screen.getByRole("heading", {
        name: "生産性を向上させる準備はできましたか？",
      });
      expect(ctaHeading).toBeInTheDocument();
      expect(ctaHeading).toHaveClass("text-3xl");
    });

    it("should render CTA description", () => {
      const ctaDescription = screen.getByText(
        "今すぐTaskMasterを始めて、タスク管理を効率化しましょう。"
      );
      expect(ctaDescription).toBeInTheDocument();
    });

    it("should render CTA button", () => {
      const ctaButton = screen.getByRole("link", {
        name: /無料アカウントを作成/,
      });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute("href", "/auth/signup");
    });

    it("should have blue background for CTA section", () => {
      const ctaHeading = screen.getByText(
        "生産性を向上させる準備はできましたか？"
      );
      const ctaSection = ctaHeading.closest(".bg-blue-600");
      expect(ctaSection).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("should render footer links", () => {
      const termsLink = screen.getByRole("link", { name: "利用規約" });
      const privacyLink = screen.getByRole("link", {
        name: "プライバシーポリシー",
      });
      const contactLink = screen.getByRole("link", { name: "お問い合わせ" });

      expect(termsLink).toBeInTheDocument();
      expect(privacyLink).toBeInTheDocument();
      expect(contactLink).toBeInTheDocument();
    });

    it("should render copyright notice", () => {
      const copyright = screen.getByText(
        "© 2023 TaskMaster, Inc. All rights reserved."
      );
      expect(copyright).toBeInTheDocument();
    });
  });

  describe("Layout and Structure", () => {
    it("should have proper page structure", () => {
      // Check main page wrapper by finding the outermost div with min-h-screen
      const pageWrapper = document.querySelector(".min-h-screen");
      expect(pageWrapper).toBeInTheDocument();
    });

    it("should render responsive navigation", () => {
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass("bg-white", "shadow-sm");
    });

    it("should have proper section backgrounds", () => {
      // Hero section should be white
      const heroSection = screen
        .getByText("タスク管理を簡単に、効率的に")
        .closest(".py-12");
      expect(heroSection).toHaveClass("bg-white");

      // Features section should be gray
      const featuresSection = screen
        .getByText("TaskMasterの主な機能")
        .closest(".py-12");
      expect(featuresSection).toHaveClass("bg-gray-50");
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should have alt text for images", () => {
      const images = screen.getAllByRole("img");
      images.forEach((image) => {
        expect(image).toHaveAttribute("alt");
      });
    });

    it("should have proper link text", () => {
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveTextContent(/.+/); // Should have some text content
      });
    });

    it("should have aria-hidden on decorative icons", () => {
      // Feature icons should have aria-hidden
      const listIcon = screen.getByTestId("list-icon");
      expect(listIcon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Content", () => {
    it("should display Japanese content correctly", () => {
      const japaneseTexts = [
        "ログイン",
        "新規登録",
        "タスク管理を簡単に、効率的に",
        "シンプルなタスク管理",
        "プロジェクト管理",
        "リマインダー機能",
        "レポート機能",
      ];

      japaneseTexts.forEach((text) => {
        expect(screen.getByText(text)).toBeInTheDocument();
      });
    });

    it("should have consistent branding", () => {
      const brandElements = screen.getAllByText("TaskMaster");
      expect(brandElements.length).toBeGreaterThan(1); // Should appear in multiple places
    });
  });
});
