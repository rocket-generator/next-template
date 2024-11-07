import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { CheckCircle, List, Bell, BarChart3, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-blue-600">
                  TaskMaster
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログイン
              </Link>
              <Link href="/auth/signup" className="ml-4">
                <Button>新規登録</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
                TaskMaster
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                タスク管理を簡単に、効率的に
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500">
                TaskMasterは、あなたの日々のタスクを簡単に管理し、生産性を向上させるためのツールです。
              </p>
              <div className="mt-10">
                <Link href="/auth/signup">
                  <Button size="lg" className="inline-flex items-center">
                    無料で始める
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 lg:w-1/2">
              <Image
                src="/images/placeholder.svg"
                alt="TaskMaster dashboard illustration"
                width={600}
                height={400}
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* 特徴セクション */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
              特徴
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              TaskMasterの主な機能
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {[
                {
                  title: "シンプルなタスク管理",
                  description:
                    "直感的なインターフェースで、タスクの追加、編集、完了が簡単に行えます。",
                  icon: List,
                },
                {
                  title: "プロジェクト管理",
                  description:
                    "タスクをプロジェクトごとに整理し、大きな目標を達成するための進捗を把握できます。",
                  icon: CheckCircle,
                },
                {
                  title: "リマインダー機能",
                  description:
                    "重要なタスクを忘れないよう、リマインダーを設定できます。",
                  icon: Bell,
                },
                {
                  title: "レポート機能",
                  description:
                    "タスクの完了状況や生産性のトレンドを可視化し、改善点を見つけられます。",
                  icon: BarChart3,
                },
              ].map((feature) => (
                <div key={feature.title} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      {feature.title}
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTAセクション */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">
              生産性を向上させる準備はできましたか？
            </span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-100">
            今すぐTaskMasterを始めて、タスク管理を効率化しましょう。
          </p>
          <Link href="/auth/signup" className="mt-8 inline-block">
            <Button
              size="lg"
              variant="secondary"
              className="inline-flex items-center"
            >
              無料アカウントを作成
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* フッター */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              利用規約
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              プライバシーポリシー
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              お問い合わせ
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2023 TaskMaster, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
