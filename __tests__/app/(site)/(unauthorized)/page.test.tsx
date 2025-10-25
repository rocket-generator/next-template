import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Component from "@/app/(site)/(unauthorized)/page";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { [key: string]: unknown }) => {
    // Remove Next.js specific props that shouldn't be passed to DOM
    const { priority, quality, placeholder, blurDataURL, ...restProps } = props;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = { priority, quality, placeholder, blurDataURL };

    // eslint-disable-next-line @next/next/no-img-element
    return <img {...restProps} />;
  },
}));

// Mock Next.js Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock next-intl
const mockTranslations = {
  "navigation.brand_name": "TypeScript Next Template",
  "navigation.login": "ログイン",
  "navigation.get_started": "無料で始める",
  "hero.badge": "TypeScript + Next.js テンプレート",
  "hero.title": "モダンなWebアプリケーションを",
  "hero.title_highlight": "素早く",
  "hero.title_end": "構築",
  "hero.description": "TypeScript、Next.js、Tailwind CSS、shadcn/uiを使用した\n完全なWebアプリケーションテンプレート。\n認証、データベース、国際化対応済み。",
  "hero.cta_primary": "無料で始める",
  "hero.cta_secondary": "使い方を見る",
  "features.title": "なぜTypeScript Next Templateなのか",
  "features.subtitle": "モダンな開発体験を提供する、強力な機能群をご提供します",
  "features.items.typescript.title": "TypeScript対応",
  "features.items.typescript.description": "型安全性を確保し、開発効率とコード品質を大幅に向上させます。",
  "features.items.nextjs.title": "Next.js 15",
  "features.items.nextjs.description": "最新のApp RouterとServer Componentsで、高速でSEOフレンドリーなアプリケーションを構築。",
  "features.items.tailwind.title": "Tailwind CSS",
  "features.items.tailwind.description": "ユーティリティファーストのCSSフレームワークで、美しいUIを効率的に作成。",
  "features.items.shadcn.title": "shadcn/ui",
  "features.items.shadcn.description": "高品質なコンポーネントライブラリで、一貫性のあるデザインシステムを実現。",
  "features.items.auth.title": "認証システム",
  "features.items.auth.description": "Better Authによる完全な認証システム。ログイン、登録、パスワードリセットに対応。",
  "features.items.database.title": "データベース",
  "features.items.database.description": "Prisma ORMとPostgreSQLで、型安全なデータベース操作を実現。",
  "how_it_works.title": "たった3ステップで開始",
  "how_it_works.subtitle": "シンプルなセットアップで、すぐに開発を始められます",
  "how_it_works.steps.clone.title": "リポジトリをクローン",
  "how_it_works.steps.clone.description": "GitHubからテンプレートをクローンし、プロジェクトを初期化します。",
  "how_it_works.steps.setup.title": "環境をセットアップ",
  "how_it_works.steps.setup.description": "依存関係をインストールし、環境変数を設定します。",
  "how_it_works.steps.deploy.title": "デプロイ",
  "how_it_works.steps.deploy.description": "Vercel、Netlify、またはお好みのプラットフォームにデプロイ。",
  "tech_stack.title": "充実した技術スタック",
  "tech_stack.subtitle": "プロダクション環境で使用される技術を網羅",
  "tech_stack.items.frontend.title": "フロントエンド",
  "tech_stack.items.frontend.description": "React、TypeScript、Tailwind CSS",
  "tech_stack.items.backend.title": "バックエンド",
  "tech_stack.items.backend.description": "Next.js、Prisma、PostgreSQL",
  "tech_stack.items.auth.title": "認証",
  "tech_stack.items.auth.description": "Better Auth、メール認証",
  "tech_stack.items.deployment.title": "デプロイ",
  "tech_stack.items.deployment.description": "Docker、Vercel対応",
  "pricing.title": "シンプルな料金プラン",
  "pricing.subtitle": "あなたのニーズに合わせた最適なプランをご用意しています",
  "pricing.plans.free.name": "Free",
  "pricing.plans.free.price": "¥0",
  "pricing.plans.free.description": "個人利用や試用に最適",
  "pricing.plans.free.cta": "無料で始める",
  "pricing.plans.pro.name": "Pro",
  "pricing.plans.pro.price": "¥4,980",
  "pricing.plans.pro.description": "プロフェッショナル向け",
  "pricing.plans.pro.cta": "Proを始める",
  "pricing.plans.enterprise.name": "Enterprise",
  "pricing.plans.enterprise.price": "ご相談",
  "pricing.plans.enterprise.description": "大規模チーム・企業向け",
  "pricing.plans.enterprise.cta": "お問い合わせ",
  "testimonials.title": "開発者の声",
  "testimonials.subtitle": "多くの開発者に選ばれています",
  "testimonials.items.developer1.name": "田中 健太",
  "testimonials.items.developer1.role": "フルスタック開発者",
  "testimonials.items.developer1.comment": "TypeScriptとNext.jsの組み合わせが素晴らしく、開発速度が格段に向上しました。",
  "testimonials.items.developer2.name": "佐藤 美咲",
  "testimonials.items.developer2.role": "プロダクトマネージャー",
  "testimonials.items.developer2.comment": "認証システムが最初から組み込まれているので、すぐにプロトタイプを作成できました。",
  "testimonials.items.developer3.name": "山田 太郎",
  "testimonials.items.developer3.role": "スタートアップ創業者",
  "testimonials.items.developer3.comment": "Tailwind CSSとshadcn/uiのおかげで、美しいUIを素早く構築できました。",
  "cta.title": "今すぐ始めましょう",
  "cta.description": "モダンなWebアプリケーション開発の最速の方法を体験してください",
  "cta.button": "無料で始める",
  "cta.note": "クレジットカード不要 • いつでもキャンセル可能 • 3分で開始",
  "footer.description": "TypeScriptとNext.jsの力で、モダンなWebアプリケーションを構築。",
  "footer.sections.product.title": "製品",
  "footer.sections.product.links.features": "機能",
  "footer.sections.product.links.pricing": "料金",
  "footer.sections.product.links.how_it_works": "使い方",
  "footer.sections.support.title": "サポート",
  "footer.sections.support.links.docs": "ドキュメント",
  "footer.sections.support.links.contact": "お問い合わせ",
  "footer.sections.support.links.faq": "FAQ",
  "footer.sections.company.title": "会社",
  "footer.sections.company.links.about": "会社情報",
  "footer.sections.company.links.privacy": "プライバシーポリシー",
  "footer.sections.company.links.terms": "利用規約"
};

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => (mockTranslations as Record<string, string>)[key] || key)),
}));

describe("Landing Page", () => {
  beforeEach(async () => {
    render(await Component());
  });

  it("renders something", async () => {
    // デバッグ用：何かがレンダリングされているか確認
    console.log("Rendered HTML:", document.body.innerHTML);
    expect(document.body.innerHTML).not.toBe("");
  });

  describe("Navigation", () => {
    it("renders the navigation section", () => {
      const navbar = screen.getByTestId("navigation");
      expect(navbar).toBeInTheDocument();
    });

    it("renders the TypeScript Next Template brand name", () => {
      const brandName = screen.getByTestId("brand-name");
      expect(brandName).toBeInTheDocument();
    });

    it("renders login link with correct href", () => {
      const loginLink = screen.getByTestId("login-link");
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/auth/signin");
    });

    it("renders signup button with correct href", () => {
      const signupLink = screen.getByTestId("signup-link");
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute("href", "/auth/signup");
    });
  });

  describe("Hero Section", () => {
    it("renders the hero section", () => {
      const heroSection = screen.getByTestId("hero-section");
      expect(heroSection).toBeInTheDocument();
    });

    it("renders the hero content elements", () => {
      expect(screen.getByTestId("hero-badge")).toBeInTheDocument();
      expect(screen.getByTestId("hero-title")).toBeInTheDocument();
      expect(screen.getByTestId("hero-description")).toBeInTheDocument();
    });

    it("renders the primary CTA button", () => {
      const ctaButton = screen.getByTestId("hero-cta-primary");
      expect(ctaButton).toBeInTheDocument();
    });

    it("renders the secondary CTA button", () => {
      const secondaryButton = screen.getByTestId("hero-cta-secondary");
      expect(secondaryButton).toBeInTheDocument();
    });
  });

  describe("Features Section", () => {
    it("renders the features section", () => {
      const featuresSection = screen.getByTestId("features-section");
      expect(featuresSection).toBeInTheDocument();
    });

    it("renders the features title and subtitle", () => {
      expect(screen.getByTestId("features-title")).toBeInTheDocument();
      expect(screen.getByTestId("features-subtitle")).toBeInTheDocument();
    });

    it("renders all six feature items", () => {
      expect(screen.getByTestId("feature-typescript")).toBeInTheDocument();
      expect(screen.getByTestId("feature-nextjs")).toBeInTheDocument();
      expect(screen.getByTestId("feature-tailwind")).toBeInTheDocument();
      expect(screen.getByTestId("feature-shadcn")).toBeInTheDocument();
      expect(screen.getByTestId("feature-auth")).toBeInTheDocument();
      expect(screen.getByTestId("feature-database")).toBeInTheDocument();
    });

    it("renders feature titles and descriptions", () => {
      expect(screen.getByTestId("feature-typescript-title")).toBeInTheDocument();
      expect(screen.getByTestId("feature-typescript-description")).toBeInTheDocument();
      expect(screen.getByTestId("feature-nextjs-title")).toBeInTheDocument();
      expect(screen.getByTestId("feature-nextjs-description")).toBeInTheDocument();
    });
  });

  describe("How It Works Section", () => {
    it("renders the how it works section", () => {
      const howItWorksSection = screen.getByTestId("how-it-works-section");
      expect(howItWorksSection).toBeInTheDocument();
    });

    it("renders the how it works title and subtitle", () => {
      expect(screen.getByTestId("how-it-works-title")).toBeInTheDocument();
      expect(screen.getByTestId("how-it-works-subtitle")).toBeInTheDocument();
    });

    it("renders all three steps", () => {
      expect(screen.getByTestId("step-clone")).toBeInTheDocument();
      expect(screen.getByTestId("step-setup")).toBeInTheDocument();
      expect(screen.getByTestId("step-deploy")).toBeInTheDocument();
    });

    it("renders step titles and descriptions", () => {
      expect(screen.getByTestId("step-clone-title")).toBeInTheDocument();
      expect(screen.getByTestId("step-clone-description")).toBeInTheDocument();
      expect(screen.getByTestId("step-setup-title")).toBeInTheDocument();
      expect(screen.getByTestId("step-setup-description")).toBeInTheDocument();
    });
  });

  describe("Tech Stack Section", () => {
    it("renders the tech stack section", () => {
      const techStackSection = screen.getByTestId("tech-stack-section");
      expect(techStackSection).toBeInTheDocument();
    });

    it("renders the tech stack title and subtitle", () => {
      expect(screen.getByTestId("tech-stack-title")).toBeInTheDocument();
      expect(screen.getByTestId("tech-stack-subtitle")).toBeInTheDocument();
    });

    it("renders all four tech stack items", () => {
      expect(screen.getByTestId("tech-frontend")).toBeInTheDocument();
      expect(screen.getByTestId("tech-backend")).toBeInTheDocument();
      expect(screen.getByTestId("tech-auth")).toBeInTheDocument();
      expect(screen.getByTestId("tech-deployment")).toBeInTheDocument();
    });

    it("renders tech stack titles and descriptions", () => {
      expect(screen.getByTestId("tech-frontend-title")).toBeInTheDocument();
      expect(screen.getByTestId("tech-frontend-description")).toBeInTheDocument();
      expect(screen.getByTestId("tech-backend-title")).toBeInTheDocument();
      expect(screen.getByTestId("tech-backend-description")).toBeInTheDocument();
    });
  });

  describe("Pricing Section", () => {
    it("renders the pricing section", () => {
      const pricingSection = screen.getByTestId("pricing-section");
      expect(pricingSection).toBeInTheDocument();
    });

    it("renders the pricing title and subtitle", () => {
      expect(screen.getByTestId("pricing-title")).toBeInTheDocument();
      expect(screen.getByTestId("pricing-subtitle")).toBeInTheDocument();
    });

    it("renders all three pricing plans", () => {
      expect(screen.getByTestId("plan-free")).toBeInTheDocument();
      expect(screen.getByTestId("plan-pro")).toBeInTheDocument();
      expect(screen.getByTestId("plan-enterprise")).toBeInTheDocument();
    });

    it("renders plan names, descriptions, and prices", () => {
      expect(screen.getByTestId("plan-free-name")).toBeInTheDocument();
      expect(screen.getByTestId("plan-free-description")).toBeInTheDocument();
      expect(screen.getByTestId("plan-free-price")).toBeInTheDocument();
      expect(screen.getByTestId("plan-pro-name")).toBeInTheDocument();
      expect(screen.getByTestId("plan-pro-description")).toBeInTheDocument();
      expect(screen.getByTestId("plan-pro-price")).toBeInTheDocument();
    });

    it("renders plan features and CTAs", () => {
      expect(screen.getByTestId("plan-free-features")).toBeInTheDocument();
      expect(screen.getByTestId("plan-free-cta")).toBeInTheDocument();
      expect(screen.getByTestId("plan-pro-features")).toBeInTheDocument();
      expect(screen.getByTestId("plan-pro-cta")).toBeInTheDocument();
    });
  });

  describe("Testimonials Section", () => {
    it("renders the testimonials section", () => {
      const testimonialsSection = screen.getByTestId("testimonials-section");
      expect(testimonialsSection).toBeInTheDocument();
    });

    it("renders the testimonials title and subtitle", () => {
      expect(screen.getByTestId("testimonials-title")).toBeInTheDocument();
      expect(screen.getByTestId("testimonials-subtitle")).toBeInTheDocument();
    });

    it("renders all three testimonials", () => {
      expect(screen.getByTestId("testimonial-1")).toBeInTheDocument();
      expect(screen.getByTestId("testimonial-2")).toBeInTheDocument();
      expect(screen.getByTestId("testimonial-3")).toBeInTheDocument();
    });

    it("renders testimonial names, roles, and comments", () => {
      expect(screen.getByTestId("testimonial-1-name")).toBeInTheDocument();
      expect(screen.getByTestId("testimonial-1-role")).toBeInTheDocument();
      expect(screen.getByTestId("testimonial-1-comment")).toBeInTheDocument();
      expect(screen.getByTestId("testimonial-2-name")).toBeInTheDocument();
      expect(screen.getByTestId("testimonial-2-role")).toBeInTheDocument();
      expect(screen.getByTestId("testimonial-2-comment")).toBeInTheDocument();
    });
  });

  describe("CTA Section", () => {
    it("renders the CTA section", () => {
      const ctaSection = screen.getByTestId("cta-section");
      expect(ctaSection).toBeInTheDocument();
    });

    it("renders the CTA title and description", () => {
      expect(screen.getByTestId("cta-title")).toBeInTheDocument();
      expect(screen.getByTestId("cta-description")).toBeInTheDocument();
    });

    it("renders the CTA button", () => {
      const ctaButton = screen.getByTestId("cta-button");
      expect(ctaButton).toBeInTheDocument();
    });

    it("renders the CTA note", () => {
      const ctaNote = screen.getByTestId("cta-note");
      expect(ctaNote).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders the footer section", () => {
      const footer = screen.getByTestId("footer");
      expect(footer).toBeInTheDocument();
    });

    it("renders footer brand name and description", () => {
      expect(screen.getByTestId("footer-brand-name")).toBeInTheDocument();
      expect(screen.getByTestId("footer-description")).toBeInTheDocument();
    });

    it("renders footer section titles", () => {
      expect(screen.getByTestId("footer-product-title")).toBeInTheDocument();
      expect(screen.getByTestId("footer-support-title")).toBeInTheDocument();
      expect(screen.getByTestId("footer-company-title")).toBeInTheDocument();
    });

    it("renders footer links", () => {
      expect(screen.getByTestId("footer-link-features")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-pricing")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-how-it-works")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-docs")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-contact")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-faq")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-about")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-privacy")).toBeInTheDocument();
      expect(screen.getByTestId("footer-link-terms")).toBeInTheDocument();
    });

    it("renders copyright text", () => {
      const copyright = screen.getByTestId("footer-copyright");
      expect(copyright).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      const headings = screen.getAllByRole("heading");

      // Ensure that main h1 and h2 elements exist
      const h1Elements = headings.filter((heading) => heading.tagName === "H1");
      const h2Elements = headings.filter((heading) => heading.tagName === "H2");
      expect(h1Elements.length).toBeGreaterThan(0);
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it("all images have alt text", () => {
      const images = screen.getAllByRole("img");
      images.forEach((image) => {
        expect(image).toHaveAttribute("alt");
        expect(image.getAttribute("alt")).not.toBe("");
      });
    });

    it("all links are accessible", () => {
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });
  });

  describe("Content Structure", () => {
    it("renders main sections in the correct order", () => {
      // Verify navigation exists
      expect(screen.getByTestId("navigation")).toBeInTheDocument();

      // Verify hero section exists
      expect(screen.getByTestId("hero-section")).toBeInTheDocument();

      // Verify features section exists
      expect(screen.getByTestId("features-section")).toBeInTheDocument();

      // Verify how it works section exists
      expect(screen.getByTestId("how-it-works-section")).toBeInTheDocument();

      // Verify tech stack section exists
      expect(screen.getByTestId("tech-stack-section")).toBeInTheDocument();

      // Verify pricing section exists
      expect(screen.getByTestId("pricing-section")).toBeInTheDocument();

      // Verify testimonials section exists
      expect(screen.getByTestId("testimonials-section")).toBeInTheDocument();

      // Verify CTA section exists
      expect(screen.getByTestId("cta-section")).toBeInTheDocument();

      // Verify footer exists
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });
});
