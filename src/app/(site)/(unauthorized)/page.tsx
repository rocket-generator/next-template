import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/atoms/button";
import {
  Sparkles,
  Code,
  Check,
  Shield,
  Database,
  Users,
  Settings,
  GitBranch,
  Server,
  Globe,
} from "lucide-react";

export default async function LandingPage() {
  const t = await getTranslations("Landing");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ナビゲーションバー */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50" data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-lg">TS</span>
                </div>
                <span className="text-xl font-bold text-gray-900" data-testid="brand-name">
                  {t("navigation.brand_name")}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                data-testid="login-link"
              >
                {t("navigation.login")}
              </Link>
              <Link href="/auth/signup" data-testid="signup-link">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  {t("navigation.get_started")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-black text-xs font-medium mb-6" data-testid="hero-badge">
              {t("hero.badge")}
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight" data-testid="hero-title">
              {t("hero.title")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                {t("hero.title_highlight")}
              </span>
              {t("hero.title_end")}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto whitespace-pre-line" data-testid="hero-description">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" data-testid="hero-cta-primary">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  {t("hero.cta_primary")}
                </Button>
              </Link>
              <Link href="#how-it-works" data-testid="hero-cta-secondary">
                <Button size="lg" variant="outline">
                  {t("hero.cta_secondary")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section id="features" className="py-20 bg-gray-50" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" data-testid="features-title">
              {t("features.title")}
            </h2>
            <p className="text-xl text-gray-600" data-testid="features-subtitle">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="features-grid">
            {[
              {
                icon: Code,
                title: t("features.items.typescript.title"),
                description: t("features.items.typescript.description"),
                testId: "feature-typescript"
              },
              {
                icon: Globe,
                title: t("features.items.nextjs.title"),
                description: t("features.items.nextjs.description"),
                testId: "feature-nextjs"
              },
              {
                icon: Sparkles,
                title: t("features.items.tailwind.title"),
                description: t("features.items.tailwind.description"),
                testId: "feature-tailwind"
              },
              {
                icon: Shield,
                title: t("features.items.shadcn.title"),
                description: t("features.items.shadcn.description"),
                testId: "feature-shadcn"
              },
              {
                icon: Users,
                title: t("features.items.auth.title"),
                description: t("features.items.auth.description"),
                testId: "feature-auth"
              },
              {
                icon: Database,
                title: t("features.items.database.title"),
                description: t("features.items.database.description"),
                testId: "feature-database"
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
                data-testid={feature.testId}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center mx-auto" data-testid={`${feature.testId}-title`}>
                  {feature.title}
                </h3>
                <p className="text-gray-600" data-testid={`${feature.testId}-description`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section id="how-it-works" className="py-20 bg-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" data-testid="how-it-works-title">
              {t("how_it_works.title")}
            </h2>
            <p className="text-xl text-gray-600" data-testid="how-it-works-subtitle">
              {t("how_it_works.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8" data-testid="how-it-works-steps">
            {[
              {
                step: "1",
                title: t("how_it_works.steps.clone.title"),
                description: t("how_it_works.steps.clone.description"),
                icon: GitBranch,
                testId: "step-clone"
              },
              {
                step: "2",
                title: t("how_it_works.steps.setup.title"),
                description: t("how_it_works.steps.setup.description"),
                icon: Settings,
                testId: "step-setup"
              },
              {
                step: "3",
                title: t("how_it_works.steps.deploy.title"),
                description: t("how_it_works.steps.deploy.description"),
                icon: Server,
                testId: "step-deploy"
              },
            ].map((step, index) => (
              <div key={step.title} className="relative" data-testid={step.testId}>
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200"></div>
                )}
                <div className="relative bg-gray-50 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                    {step.step}
                  </div>
                  <step.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid={`${step.testId}-title`}>
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-left" data-testid={`${step.testId}-description`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 技術スタックセクション */}
      <section className="py-20 bg-gray-50" data-testid="tech-stack-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" data-testid="tech-stack-title">
              {t("tech_stack.title")}
            </h2>
            <p className="text-xl text-gray-600" data-testid="tech-stack-subtitle">
              {t("tech_stack.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="tech-stack-grid">
            {[
              {
                title: t("tech_stack.items.frontend.title"),
                description: t("tech_stack.items.frontend.description"),
                icon: Code,
                testId: "tech-frontend"
              },
              {
                title: t("tech_stack.items.backend.title"),
                description: t("tech_stack.items.backend.description"),
                icon: Server,
                testId: "tech-backend"
              },
              {
                title: t("tech_stack.items.auth.title"),
                description: t("tech_stack.items.auth.description"),
                icon: Shield,
                testId: "tech-auth"
              },
              {
                title: t("tech_stack.items.deployment.title"),
                description: t("tech_stack.items.deployment.description"),
                icon: Globe,
                testId: "tech-deployment"
              },
            ].map((format) => (
              <div
                key={format.title}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
                data-testid={format.testId}
              >
                <format.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`${format.testId}-title`}>
                  {format.title}
                </h3>
                <p className="text-sm text-gray-600 text-left" data-testid={`${format.testId}-description`}>
                  {format.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section id="pricing" className="py-20 bg-white" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" data-testid="pricing-title">
              {t("pricing.title")}
            </h2>
            <p className="text-xl text-gray-600" data-testid="pricing-subtitle">
              {t("pricing.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" data-testid="pricing-plans">
            {[
              {
                name: t("pricing.plans.free.name"),
                price: t("pricing.plans.free.price"),
                description: t("pricing.plans.free.description"),
                features: [
                  "完全なソースコード",
                  "基本的な認証機能",
                  "データベース設定",
                  "GitHubサポート"
                ],
                cta: t("pricing.plans.free.cta"),
                highlighted: false,
                testId: "plan-free"
              },
              {
                name: t("pricing.plans.pro.name"),
                price: t("pricing.plans.pro.price"),
                description: t("pricing.plans.pro.description"),
                features: [
                  "Freeの全機能",
                  "優先サポート",
                  "カスタム機能追加",
                  "デプロイ支援",
                  "セキュリティ監査",
                  "パフォーマンス最適化"
                ],
                cta: t("pricing.plans.pro.cta"),
                highlighted: true,
                testId: "plan-pro"
              },
              {
                name: t("pricing.plans.enterprise.name"),
                price: t("pricing.plans.enterprise.price"),
                description: t("pricing.plans.enterprise.description"),
                features: [
                  "Proの全機能",
                  "専任サポート",
                  "SLA保証",
                  "オンプレミス対応",
                  "カスタム開発",
                  "セキュリティ監査"
                ],
                cta: t("pricing.plans.enterprise.cta"),
                highlighted: false,
                testId: "plan-enterprise"
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-2xl scale-105"
                    : "bg-white border border-gray-200 shadow-lg"
                }`}
                data-testid={plan.testId}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                      おすすめ
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                    data-testid={`${plan.testId}-name`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${
                      plan.highlighted ? "text-blue-100" : "text-gray-600"
                    }`}
                    data-testid={`${plan.testId}-description`}
                  >
                    {plan.description}
                  </p>
                  <div
                    className={`text-4xl font-bold ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                    data-testid={`${plan.testId}-price`}
                  >
                    {plan.price}
                    {plan.price !== "ご相談" && (
                      <span className="text-lg font-normal">/月</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8" data-testid={`${plan.testId}-features`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check
                        className={`w-5 h-5 mr-2 flex-shrink-0 ${
                          plan.highlighted ? "text-white" : "text-green-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlighted ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={
                    plan.name === "Enterprise"
                      ? "/contact"
                      : plan.name === "Pro"
                      ? "/auth/signup?plan=pro"
                      : "/auth/signup"
                  }
                  className="block"
                  data-testid={`${plan.testId}-cta`}
                >
                  <Button
                    className={`w-full ${
                      plan.name === "Free"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                        : plan.highlighted
                        ? "bg-white text-blue-600 hover:bg-gray-100"
                        : ""
                    }`}
                    variant={plan.highlighted ? "secondary" : "default"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* お客様の声 */}
      <section className="py-20 bg-gray-50" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" data-testid="testimonials-title">
              {t("testimonials.title")}
            </h2>
            <p className="text-xl text-gray-600" data-testid="testimonials-subtitle">
              {t("testimonials.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8" data-testid="testimonials-grid">
            {[
              {
                name: t("testimonials.items.developer1.name"),
                role: t("testimonials.items.developer1.role"),
                comment: t("testimonials.items.developer1.comment"),
                avatar: "/images/testimonials-01.jpg",
                testId: "testimonial-1"
              },
              {
                name: t("testimonials.items.developer2.name"),
                role: t("testimonials.items.developer2.role"),
                comment: t("testimonials.items.developer2.comment"),
                avatar: "/images/testimonials-02.jpg",
                testId: "testimonial-2"
              },
              {
                name: t("testimonials.items.developer3.name"),
                role: t("testimonials.items.developer3.role"),
                comment: t("testimonials.items.developer3.comment"),
                avatar: "/images/testimonials-03.jpg",
                testId: "testimonial-3"
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-xl p-6 shadow-lg"
                data-testid={testimonial.testId}
              >
                <div className="flex items-center mb-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name + "の写真"}
                    width={100}
                    height={100}
                    className="rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900" data-testid={`${testimonial.testId}-name`}>
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600" data-testid={`${testimonial.testId}-role`}>{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic" data-testid={`${testimonial.testId}-comment`}>{testimonial.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-500" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-testid="cta-title">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-blue-100 mb-8" data-testid="cta-description">
            {t("cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" data-testid="cta-button">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                {t("cta.button")}
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-100" data-testid="cta-note">
            {t("cta.note")}
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-300" data-testid="footer">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">TS</span>
                </div>
                <span className="text-lg font-bold text-white" data-testid="footer-brand-name">
                  {t("navigation.brand_name")}
                </span>
              </div>
              <p className="text-sm" data-testid="footer-description">{t("footer.description")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4" data-testid="footer-product-title">
                {t("footer.sections.product.title")}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-features"
                  >
                    {t("footer.sections.product.links.features")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-pricing"
                  >
                    {t("footer.sections.product.links.pricing")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-how-it-works"
                  >
                    {t("footer.sections.product.links.how_it_works")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4" data-testid="footer-support-title">
                {t("footer.sections.support.title")}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-docs"
                  >
                    {t("footer.sections.support.links.docs")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-contact"
                  >
                    {t("footer.sections.support.links.contact")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-faq"
                  >
                    {t("footer.sections.support.links.faq")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4" data-testid="footer-company-title">
                {t("footer.sections.company.title")}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-about"
                  >
                    {t("footer.sections.company.links.about")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-privacy"
                  >
                    {t("footer.sections.company.links.privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                    data-testid="footer-link-terms"
                  >
                    {t("footer.sections.company.links.terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p data-testid="footer-copyright">
              &copy; {new Date().getFullYear()} {t("navigation.brand_name")}. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
