import Link from "next/link";
import { Button } from "@/components/atoms/button";
import {
  Sparkles,
  Upload,
  Clock,
  Code,
  FileText,
  Image as ImageIcon,
  Table,
  Check,
  Zap,
  Shield,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ナビゲーションバー */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Prototype Generator
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ログイン
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  無料で始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-black text-xs font-medium mb-6">
              AI駆動の次世代プロトタイプ生成
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              アイデアを
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                10分
              </span>
              で
              <br />
              カタチに変える
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              要件定義書、Excel/CSV、スクリーンショット、ワイヤーフレームから
              <br />
              美しく機能的なWebプロトタイプを瞬時に生成。
              <br />
              コーディング不要で、誰でも簡単にアプリケーションを作成できます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  無料で始める
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  使い方を見る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              なぜAI Prototype Generatorなのか
            </h2>
            <p className="text-xl text-gray-600">
              従来の開発プロセスを革新する、強力な機能群をご提供します
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "10分で完成",
                description:
                  "アイデアから動作するプロトタイプまで、わずか10分。開発期間を大幅に短縮します。",
              },
              {
                icon: Upload,
                title: "多様な入力形式",
                description:
                  "テキスト、Excel/CSV、画像、ワイヤーフレームなど、あらゆる形式の要件を理解します。",
              },
              {
                icon: Sparkles,
                title: "AI自動生成",
                description:
                  "最新のAI技術により、要件を理解し、最適なUIとコードを自動生成します。",
              },
              {
                icon: Code,
                title: "コード出力",
                description:
                  "生成されたプロトタイプは、実際のHTMLl/CSS/JavaScriptコードとして出力可能です。",
              },
              {
                icon: Shield,
                title: "セキュア",
                description:
                  "エンタープライズグレードのセキュリティで、あなたのデータを安全に保護します。",
              },
              {
                icon: Zap,
                title: "即座にプレビュー",
                description:
                  "生成されたプロトタイプは、即座にブラウザでプレビュー・共有できます。",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center mx-auto">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              たった3ステップで完成
            </h2>
            <p className="text-xl text-gray-600">
              シンプルな操作で、プロフェッショナルなプロトタイプを作成します
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "要件をアップロード",
                description:
                  "テキスト、Excel/CSV、画像など、お好きな形式で要件をアップロードします。",
                icon: Upload,
              },
              {
                step: "2",
                title: "AIが自動生成",
                description:
                  "アップロードされた要件を基に、AIが最適なプロトタイプを生成します。",
                icon: Sparkles,
              },
              {
                step: "3",
                title: "プレビュー＆ダウンロード",
                description:
                  "生成されたプロトタイプをプレビューし、コードをダウンロードできます。",
                icon: Zap,
              },
            ].map((step, index) => (
              <div key={step.title} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200"></div>
                )}
                <div className="relative bg-gray-50 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                    {step.step}
                  </div>
                  <step.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-left">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 対応する入力形式 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              あらゆる形式の要件に対応
            </h2>
            <p className="text-xl text-gray-600">
              お持ちの資料をそのまま活用できます
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "要件定義書",
                description: "Word、PDF、テキスト形式の要件定義書から生成",
                icon: FileText,
              },
              {
                title: "Excel/CSV",
                description: "データ構造やフィールド定義から管理画面を生成",
                icon: Table,
              },
              {
                title: "スクリーンショット",
                description: "既存アプリの画面から類似のUIを生成",
                icon: ImageIcon,
              },
              {
                title: "ワイヤーフレーム",
                description: "手書きスケッチやワイヤーフレームから生成",
                icon: Code,
              },
            ].map((format) => (
              <div
                key={format.title}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <format.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {format.title}
                </h3>
                <p className="text-sm text-gray-600 text-left">
                  {format.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              シンプルな料金プラン
            </h2>
            <p className="text-xl text-gray-600">
              あなたのニーズに合わせた最適なプランをご用意しています
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "¥0",
                description: "個人利用や試用に最適",
                features: [
                  "月3回まで生成可能",
                  "基本的なテンプレート",
                  "コミュニティサポート",
                  "7日間のプロジェクト保存",
                ],
                cta: "無料で始める",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "¥4,980",
                description: "プロフェッショナル向け",
                features: [
                  "無制限の生成",
                  "全テンプレート利用可能",
                  "優先サポート",
                  "無制限のプロジェクト保存",
                  "カスタムブランディング",
                  "API アクセス",
                ],
                cta: "Proを始める",
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "ご相談",
                description: "大規模チーム・企業向け",
                features: [
                  "Proの全機能",
                  "専任サポート",
                  "SLA保証",
                  "オンプレミス対応",
                  "カスタム開発",
                  "セキュリティ監査",
                ],
                cta: "お問い合わせ",
                highlighted: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-2xl scale-105"
                    : "bg-white border border-gray-200 shadow-lg"
                }`}
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
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${
                      plan.highlighted ? "text-blue-100" : "text-gray-600"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div
                    className={`text-4xl font-bold ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                    {plan.price !== "ご相談" && (
                      <span className="text-lg font-normal">/月</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              お客様の声
            </h2>
            <p className="text-xl text-gray-600">
              多くの企業やクリエイターに選ばれています
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "高橋 悠斗",
                role: "スタートアップ創業者",
                comment:
                  "アイデアを素早く形にできるので、投資家へのプレゼンが格段に楽になりました。",
                avatar: "/images/testimonials-01.jpg",
              },
              {
                name: "加藤 里奈",
                role: "プロダクトマネージャー",
                comment:
                  "チームとのコミュニケーションが円滑になり、開発スピードが3倍になりました。",
                avatar: "/images/testimonials-02.jpg",
              },
              {
                name: "渡辺 祐介",
                role: "フリーランスデザイナー",
                comment:
                  "クライアントへの提案が視覚的になり、受注率が大幅に向上しました。",
                avatar: "/images/testimonials-03.jpg",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name + "の写真"}
                    width={100}
                    height={100}
                    className="rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">{testimonial.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            今すぐ始めましょう
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            アイデアを形にする最速の方法を体験してください
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                無料で始める
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            クレジットカード不要 • いつでもキャンセル可能 • 3分で開始
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-lg font-bold text-white">
                  Prototype Generator
                </span>
              </div>
              <p className="text-sm">AIの力で、アイデアを瞬時にカタチに。</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">製品</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    機能
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    料金
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    使い方
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">サポート</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-white transition-colors"
                  >
                    ドキュメント
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">会社</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    会社情報
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    利用規約
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} AI Prototype Generator. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
