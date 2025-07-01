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

describe("Landing Page", () => {
  beforeEach(() => {
    render(<Component />);
  });

  describe("Navigation", () => {
    it("renders the navigation section", () => {
      const navbar = screen.getByTestId("navigation");
      expect(navbar).toBeInTheDocument();
    });

    it("renders the TaskMaster logo and brand name", () => {
      const brandLogo = screen.getByTestId("brand-logo");
      const brandName = screen.getByTestId("brand-name");
      const brandIcon = screen.getByTestId("brand-icon");
      
      expect(brandLogo).toBeInTheDocument();
      expect(brandName).toBeInTheDocument();
      expect(brandIcon).toBeInTheDocument();
    });

    it("renders login link with correct href and aria-label", () => {
      const loginLink = screen.getByTestId("login-link");
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/auth/signin");
      expect(loginLink).toHaveAttribute("aria-label", "Sign in to TaskMaster");
    });

    it("renders signup button with correct href and aria-label", () => {
      const signupLink = screen.getByTestId("signup-link");
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute("href", "/auth/signup");
      expect(signupLink).toHaveAttribute("aria-label", "Create new account");
    });
  });

  describe("Hero Section", () => {
    it("renders the hero section", () => {
      const heroSection = screen.getByTestId("hero-section");
      expect(heroSection).toBeInTheDocument();
    });

    it("renders the hero content elements", () => {
      expect(screen.getByTestId("hero-subtitle")).toBeInTheDocument();
      expect(screen.getByTestId("hero-title")).toBeInTheDocument();
      expect(screen.getByTestId("hero-description")).toBeInTheDocument();
    });

    it("renders the primary CTA button with correct attributes", () => {
      const ctaLink = screen.getByTestId("hero-cta-link");
      const ctaButton = screen.getByTestId("hero-cta-button");
      const ctaArrow = screen.getByTestId("hero-cta-arrow");
      
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink).toHaveAttribute("href", "/auth/signup");
      expect(ctaLink).toHaveAttribute("aria-label", "Start using TaskMaster for free");
      expect(ctaButton).toBeInTheDocument();
      expect(ctaArrow).toBeInTheDocument();
    });

    it("renders the hero image with correct attributes", () => {
      const heroImage = screen.getByTestId("hero-image");
      expect(heroImage).toBeInTheDocument();
      expect(heroImage).toHaveAttribute("src", "/images/placeholder.svg");
      expect(heroImage).toHaveAttribute("alt", "TaskMaster dashboard illustration");
    });
  });

  describe("Features Section", () => {
    it("renders the features section", () => {
      const featuresSection = screen.getByTestId("features-section");
      expect(featuresSection).toBeInTheDocument();
    });

    it("renders the features section content elements", () => {
      expect(screen.getByTestId("features-subtitle")).toBeInTheDocument();
      expect(screen.getByTestId("features-title")).toBeInTheDocument();
      expect(screen.getByTestId("features-grid")).toBeInTheDocument();
    });

    it("renders all four feature items with correct data-testids", () => {
      const featureTestIds = [
        "feature-simple-task-management",
        "feature-project-management",
        "feature-reminder",
        "feature-reporting",
      ];

      featureTestIds.forEach((testId) => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
        expect(screen.getByTestId(`${testId}-icon`)).toBeInTheDocument();
        expect(screen.getByTestId(`${testId}-title`)).toBeInTheDocument();
        expect(screen.getByTestId(`${testId}-description`)).toBeInTheDocument();
      });
    });
  });

  describe("CTA Section", () => {
    it("renders the CTA section", () => {
      const ctaSection = screen.getByTestId("cta-section");
      expect(ctaSection).toBeInTheDocument();
    });

    it("renders the CTA section content elements", () => {
      expect(screen.getByTestId("cta-title")).toBeInTheDocument();
      expect(screen.getByTestId("cta-description")).toBeInTheDocument();
    });

    it("renders the secondary CTA button with correct attributes", () => {
      const ctaLink = screen.getByTestId("cta-link");
      const ctaButton = screen.getByTestId("cta-button");
      const ctaArrow = screen.getByTestId("cta-arrow");
      
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink).toHaveAttribute("href", "/auth/signup");
      expect(ctaLink).toHaveAttribute("aria-label", "Create free TaskMaster account");
      expect(ctaButton).toBeInTheDocument();
      expect(ctaArrow).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders the footer section", () => {
      const footer = screen.getByTestId("footer");
      expect(footer).toBeInTheDocument();
    });

    it("renders footer links with correct attributes", () => {
      const footerLinks = screen.getByTestId("footer-links");
      const termsLink = screen.getByTestId("terms-link");
      const privacyLink = screen.getByTestId("privacy-link");
      const contactLink = screen.getByTestId("contact-link");
      
      expect(footerLinks).toBeInTheDocument();
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute("aria-label", "Terms of Service");
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute("aria-label", "Privacy Policy");
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute("aria-label", "Contact Us");
    });

    it("renders copyright text", () => {
      const copyright = screen.getByTestId("copyright");
      expect(copyright).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      const headings = screen.getAllByRole("heading");

      // Ensure that main h2 elements exist
      const h2Elements = headings.filter((heading) => heading.tagName === "H2");
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

    it("all important elements have appropriate aria-labels", () => {
      // Check links with aria-labels
      expect(screen.getByTestId("login-link")).toHaveAttribute("aria-label");
      expect(screen.getByTestId("signup-link")).toHaveAttribute("aria-label");
      expect(screen.getByTestId("hero-cta-link")).toHaveAttribute("aria-label");
      expect(screen.getByTestId("cta-link")).toHaveAttribute("aria-label");
      expect(screen.getByTestId("terms-link")).toHaveAttribute("aria-label");
      expect(screen.getByTestId("privacy-link")).toHaveAttribute("aria-label");
      expect(screen.getByTestId("contact-link")).toHaveAttribute("aria-label");
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

      // Verify CTA section exists
      expect(screen.getByTestId("cta-section")).toBeInTheDocument();

      // Verify footer exists
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("renders feature grid with all features", () => {
      const featuresGrid = screen.getByTestId("features-grid");
      expect(featuresGrid).toBeInTheDocument();
      
      // Verify all feature items are present
      expect(screen.getByTestId("feature-simple-task-management")).toBeInTheDocument();
      expect(screen.getByTestId("feature-project-management")).toBeInTheDocument();
      expect(screen.getByTestId("feature-reminder")).toBeInTheDocument();
      expect(screen.getByTestId("feature-reporting")).toBeInTheDocument();
    });
  });
});
