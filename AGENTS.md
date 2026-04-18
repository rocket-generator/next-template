# AGENTS.md

このリポジトリで作業する AI エージェント（Codex / Cursor / Copilot / Claude Code など）向けの運用規約。詳細トピックは `docs/guides/` 配下にあり、本ファイルからリンクする。

> **Claude Code を利用する場合は、本ファイルに加えて [CLAUDE.md](./CLAUDE.md) も参照すること。**

---

## プロジェクト概要

認証・管理画面・メール送信・オンラインストレージ保存を備えた Next.js 製 Web サービステンプレート。

### 提供される機能

- 認証（ログイン、ユーザー登録、パスワードリセット、メール認証）
- 管理画面（ユーザー管理、アバター登録）
- 単独機能（メール送信、オンラインストレージ保存）

### 技術スタック

| 領域 | 採用技術 |
|------|----------|
| フレームワーク | Next.js 16 (App Router) / React 19 |
| 言語 | TypeScript 5 |
| UI | Tailwind CSS 3 / shadcn/ui / Radix UI |
| フォーム | React Hook Form + Zod |
| 国際化 | next-intl 4 |
| DB | PostgreSQL + Prisma 7 |
| 認証 | Better Auth 1.3 |
| ストレージ/メール | S3 / S3互換 / GCS / SES / SMTP |
| テスト | Jest / Testing Library / Playwright / Storybook 9 |

**重要**: 技術スタックに記載されたバージョンを勝手に変更しないこと。必要な場合は理由を示して承認を得ること。

---

## セットアップ・主要コマンド

```bash
# 開発
npm run dev                      # 開発サーバ（Turbopack）
npm run build                    # 本番ビルド
npm run start                    # 本番サーバ
npm run lint                     # ESLint
npm run type-check               # tsc --noEmit

# DB
npm run db:setup                 # generate + push + seed
npm run db:migrate               # マイグレーション作成＆適用
npm run db:reset                 # リセット＆再作成
npm run db:studio                # Prisma Studio
npm run docker:db:setup          # Docker 環境用

# テスト / Storybook
npm run test                     # Jest
npm run test:watch               # Jest ウォッチ
npm run test:e2e                 # Playwright
npm run storybook                # Storybook 起動
npm run build-storybook          # Storybook ビルド
```

---

## ディレクトリ構造

```
src/
├── app/                   # Next.js App Router（ページ + actions.ts）
├── components/            # UI コンポーネント
│   ├── atoms/             #   shadcn/ui のみ配置（カスタム禁止）
│   ├── molecules/         #   atom の組み合わせ
│   └── organisms/         #   ページセクション・独立 UI 領域
├── repositories/          # データアクセス層（全て BaseRepository 継承）
├── models/                # Zod スキーマ（レスポンス/ドメインモデル）
├── requests/              # Zod スキーマ（リクエスト）
├── services/              # ドメインサービス（AuthService 等）
├── libraries/             # 横断ユーティリティ（auth, email, storage, hash ...）
├── hooks/                 # React フック
├── i18n/                  # next-intl 設定
└── generated/prisma/      # Prisma 生成物（gitignore 対象）

messages/                  # 翻訳 JSON（ja.json / en.json）
prisma/                    # schema.prisma, migrations, seed
__tests__/                 # Jest テスト（src のディレクトリ構造を反映）
e2e/                       # Playwright テスト
docs/guides/               # 詳細ガイド
```

---

## コア規約（サマリ）

### TypeScript

- `any` 型禁止。`React.FC` 不使用。コンポーネントは `const` 宣言
- Shadcn + Tailwind を使用（`Card` コンポーネントは使わない）
- **詳細**: [docs/guides/typescript.md](./docs/guides/typescript.md)

### コンポーネント設計

- Server Components First。インタラクティブ部分のみ最小限の Client Component
- コンポーネントは `src/components/{atoms,molecules,organisms}/ComponentName/index.tsx` 形式
- `atoms` は shadcn/ui のみ。カスタム要素を置かない（`src/components/ui` も使わない）
- ページ全体に影響する状態は URL クエリパラメータで管理
- **詳細**: [docs/guides/components.md](./docs/guides/components.md)

### データアクセス

- データアクセスは `src/repositories/` の Repository クラス経由必須
- 全 Repository は `BaseRepository`（または Prisma/Airtable 等派生）を継承
- Prisma: `PrismaRepository` / 独自 API: `BaseRepository` / ローカル: `LocalRepository` / AirTable: `AirtableRepository` / Dify: `ChatRepository` or `WorkflowRepository`
- **モデル**: `src/models/` に zod スキーマ
- **リクエスト**: `src/requests/` に `[entity]_[action]_request.ts`
- **詳細**: [docs/guides/data-access.md](./docs/guides/data-access.md)

### サーバサイド処理

- DB アクセス等は **Server Actions で実装**。API Route の新規作成禁止（`src/app/api` は Auth 用途のみ）
- Server Actions は該当ページの `actions.ts` に配置、先頭に `"use server";`
- Server Actions / API エンドポイントでは Zod で入力検証
- テキストコンテンツは常に HTML エスケープ

### ロギング / 監視

- `src/libraries` / `src/repositories` / `src/app` のサーバサイドログは `src/libraries/logger.ts` を使う
- 上記範囲で直接 `console.*` を使わない（`src/libraries/logger.ts` の console adapter を除く）
- raw email / URL / token / query string をログへ出さない
- logger の使い方・命名・テスト方法は [docs/guides/logging.md](./docs/guides/logging.md) を参照する

### 国際化（i18n）

- UI に表示する全テキストは next-intl 経由。ハードコード禁止
- `messages/ja.json` と `messages/en.json` の両方を更新
- JSON のキー重複・フォーマット崩れに注意（AI がやりがち）
- **詳細**: [docs/guides/i18n.md](./docs/guides/i18n.md)

### 認証

- Better Auth + Prisma。サーバヘルパーは `src/libraries/auth.ts`、クライアントは `src/libraries/auth-client.ts`
- 保護ページは `src/proxy.ts` の `PUBLIC_PATHS` 管理
- **詳細**: [docs/guides/auth.md](./docs/guides/auth.md)

### 環境変数

- **`.env` は改変禁止**
- 環境変数追加時は `.env.example` にのみ追記。削除・変更も禁止

### 管理画面 / プロバイダー追加

トピック別ガイドを参照：

- 管理画面構築: [docs/guides/admin-pages.md](./docs/guides/admin-pages.md)
- メールプロバイダー追加: [docs/guides/email-provider.md](./docs/guides/email-provider.md)
- ストレージプロバイダー追加: [docs/guides/storage-provider.md](./docs/guides/storage-provider.md)

---

## テスト方針

すべての新規・改修コードには対応するテストが必要。

| 種別 | 対象 | ガイド |
|------|------|--------|
| Unit Test | ライブラリ・ユーティリティ・ロジック | [docs/guides/unit-testing.md](./docs/guides/unit-testing.md) |
| Component Test | UI コンポーネント | [docs/guides/component-testing.md](./docs/guides/component-testing.md) |
| Storybook | UI コンポーネント | [docs/guides/storybook.md](./docs/guides/storybook.md) |
| E2E | ページ・機能 | `e2e/` に Playwright テスト |

### 共通ルール

- `__tests__/` 配下にソースのディレクトリ構造を反映して配置
- `it("should ...")` 形式（英語）で AAA パターン
- **クエリは `data-testid` を基本とする**
- `getByText` / `getByLabelText` / `getByRole with name` は国際化耐性のため禁止
- アイコンは `lucide-react` をモックして `data-testid` を付与

### カバレッジ目標

- ライブラリ・ユーティリティ: 90% 以上
- コンポーネント: 80% 以上（重要機能 100%）
- 全体: 80% 以上

---

## 作業プロセス

すべてのタスクは以下の流れで進める。

### 1. 指示の分析と計画

- 主要タスクを要約
- 技術スタックの制約を確認（**バージョン変更は承認必須**）
- 要件・制約・潜在的課題を洗い出し
- 実行ステップを詳細に列挙し、最適な順序を決定

### 2. 重複実装の防止

実装前に以下を確認：

- 既存の類似機能
- 同名・類似名の関数/コンポーネント
- 重複する API エンドポイント
- 共通化可能な処理

### 3. 実行

- ステップを順に実行し、都度簡潔に進捗を報告
- ディレクトリ構造・命名規則・共通処理の配置を遵守

### 4. 品質管理

- 各ステップの結果を検証
- エラー発生時: 原因特定 → 対策実施 → 動作検証 → ログ確認
- 検証結果は「項目 / 期待 / 実際 / 対応」で記録

### 5. 最終確認

- 成果物全体を指示内容と照合
- 機能重複がないか最終確認
- **実装完了チェックリスト**（次節）を通す

### 6. 結果報告

```markdown
# 実行結果報告

## 概要
[要約]

## 実行ステップ
1. [ステップ1と結果]

## 最終成果物
[成果物 / リンク]

## 課題対応
- 発生問題と対応内容

## 注意点・改善提案

## コミットメッセージ
- [git diff を要約した 1 行]
```

---

## 実装完了チェックリスト

実装が完了したら必ず以下を確認し、不備があれば修正する：

- [ ] ビルドがエラーなく通る
- [ ] モックデータやダミーデータを使った仮実装がなく、完全に実装されている
- [ ] 全ての `page.tsx` が Server Component になっている
- [ ] ページやコンポーネントの全文字列が国際化対応されている
- [ ] 言語ファイルが正しい JSON フォーマットで、キーの重複がない
- [ ] 全てのコンポーネントが `src/components/` 配下にある（`src/page` に置かない）
- [ ] `src/components/atoms` には shadcn のコンポーネントのみで、カスタマイズしていない
- [ ] 新規作成コンポーネントには Storybook コードが存在する
- [ ] 新しいコードに Unit Test が書かれている
- [ ] 新しいページ・機能に E2E テストが書かれている
- [ ] 改修したコードに関連する Unit Test / E2E / Storybook が更新されている
- [ ] 全 Unit Test が Pass する
- [ ] 全 E2E テストが Pass する
- [ ] テストで `getByText` / `getByLabelText` を使わず、`data-testid` でテストしている

---

## 重要な制約

- **指示されていない変更は行わない**。必要と思われる変更は提案として報告し承認を得てから実施
- **UI/UX デザインの変更禁止**（レイアウト、色、フォント、間隔など）。変更が必要な場合は事前に理由を示し承認を得る
- **技術スタックのバージョンを勝手に変更しない**。必要な場合は理由を明示し承認を得る
- **`.env` を変更しない**。環境変数追加は `.env.example` のみに追記
- **`src/components/atoms` には shadcn のみ**（`src/components/ui` は使わない）
- 重要な判断が必要な場合は都度報告し承認を得る
- 予期せぬ問題が発生した場合は即座に報告し対応策を提案する

---

## 詳細ガイド一覧

| トピック | ファイル |
|----------|----------|
| TypeScript | [docs/guides/typescript.md](./docs/guides/typescript.md) |
| コンポーネント作成 | [docs/guides/components.md](./docs/guides/components.md) |
| データアクセス | [docs/guides/data-access.md](./docs/guides/data-access.md) |
| 国際化 | [docs/guides/i18n.md](./docs/guides/i18n.md) |
| Unit Testing | [docs/guides/unit-testing.md](./docs/guides/unit-testing.md) |
| ロギング / 監視 | [docs/guides/logging.md](./docs/guides/logging.md) |
| Component Testing | [docs/guides/component-testing.md](./docs/guides/component-testing.md) |
| Storybook | [docs/guides/storybook.md](./docs/guides/storybook.md) |
| 管理画面構築 | [docs/guides/admin-pages.md](./docs/guides/admin-pages.md) |
| 認証（Better Auth + DB 設計） | [docs/guides/auth.md](./docs/guides/auth.md) |
| メールプロバイダー追加 | [docs/guides/email-provider.md](./docs/guides/email-provider.md) |
| ストレージプロバイダー追加 | [docs/guides/storage-provider.md](./docs/guides/storage-provider.md) |

---

## エージェント向け Skill

`.agents/skills/` 配下に、上記ガイドと連動したタスク別 Skill を用意している。Claude Code / Codex / Copilot CLI など各エージェントが `Skill` 経由で必要時にロードする。`.claude/skills/` は `.agents/skills/` への symlink。

### このテンプレ固有（`docs/guides/` と連動）

- `nextjs-component-design` / `data-access-repository` / `i18n-messages`
- `auth-implementation` / `admin-page-scaffolding`
- `email-provider` / `storage-provider`
- `writing-tests` / `writing-storybook`

### 汎用 / プロジェクト横断

- `typescript-development` / `database-schema-design` / `restful-api-design`
- `frontend-design` / `ui-design` / `docker-expert` / `python-development`
- `skill-creator` / `dify-integration`

各 Skill は `docs/guides/` を正本として参照する薄い gateway。ルール変更は `docs/guides/` 側で行う。
