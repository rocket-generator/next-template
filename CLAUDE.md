# CLAUDE.md

プロジェクト固有のルールは [AGENTS.md](./AGENTS.md) を参照のこと。
本ファイルには Claude Code 特有の運用のみ記載する。

## Claude Code 固有の運用

### MCP の積極活用

- **Serena MCP**: コードベースの理解・シンボル検索・編集に必ず活用する。ファイル全体を読む前に `get_symbols_overview` / `find_symbol` でシンボル単位の参照を優先し、文脈を節約する
- **context7 MCP**: Next.js / Prisma / Better Auth / next-intl など外部ライブラリの最新仕様を確認したい場合は `use context7` で参照する

### Skill / Subagent の利用

- タスクに合致する Skill / Subagent があれば必ず起動する（1% でも該当可能性があれば確認する）
- 設計・ブレインストーミング・実装計画・レビューなど、対応 Skill があるものは Skill 経由で進める

#### プロジェクト固有 Skill（`.agents/skills/`）

実体は `.agents/skills/`。`.claude/skills` はそこへの symlink。タスクに応じて以下の Skill が `docs/guides/` と連動して発火する。

- `nextjs-component-design` — `src/app/` / `src/components/` の追加・改修
- `data-access-repository` — `src/repositories/` / `src/models/` / `src/requests/` の追加・改修
- `i18n-messages` — 翻訳追加、`messages/*.json` 更新、next-intl 設定変更
- `auth-implementation` — Better Auth / Prisma 認証（`src/libraries/auth*.ts` / `src/proxy.ts` / 認証 actions / `prisma/schema.prisma`）
- `admin-page-scaffolding` — `src/app/(site)/(authorized)/admin/` 配下のページ作成
- `email-provider` / `storage-provider` — `src/libraries/email.ts` / `storage.ts` のプロバイダー追加
- `writing-tests` — Jest / RTL テスト作成（`__tests__/` 配下）
- `writing-storybook` — `*.stories.tsx` の追加・更新

汎用 Skill（`typescript-development` / `database-schema-design` / `restful-api-design` / `frontend-design` / `ui-design` / `docker-expert` / `python-development` / `skill-creator` / `dify-integration`）も同ディレクトリに存在。

### タスク管理

- 非自明な作業は TaskCreate / TaskUpdate で細分化して可視化する
- メインタスクを分解した後、各タスクをさらにサブタスクへ分解する
