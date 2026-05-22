src/app/(site) の各ページだが、現在はすべて"Great App" のようになっているが、各ページをその内容を表す「xxxxx(ページごとのタイトル) | サービス名」という形式にする。

サービス名のところはconstantsで設定できるようにしよう。

---

## 背景
- ルートの `metadata.title` が全ページで共通の "Great App" になっており、検索結果やSNSカードでページ内容が識別できない。
- サービス名が `AppSidebar` では "TaskMaster"、`metadata.title` では "Great App" と分散しており、ブランド表記が不整合。
- `/src/app/(site)` 配下に認証前後・管理画面を含む多数のページが存在するが、個別の `metadata` が未定義でタイトル／description が適切に設定されていない。

## 方針とその理由
- **サービス名の単一ソース化**: `NEXT_PUBLIC_SERVICE_NAME` (環境変数) を優先し、なければリポジトリ既定値を返す定数／ヘルパーを用意する。これを UI 表示・metadata 双方で共有し、ブランド表記の不整合を解消する。
- **共通ヘルパーでタイトル組み立て**: `buildTitle(pageTitle)` のようなユーティリティで「ページタイトル | サービス名」を一貫生成し、重複実装と記述ゆれを防ぐ。
- **各ページで明示的な metadata 定義**: `export const metadata` または `generateMetadata` を利用し、タイトルと description をページ内容・翻訳キーに基づいて設定する。これにより SEO・アクセシビリティを改善し、将来のページ追加時の抜け漏れを防ぐ。
- **翻訳ベースのタイトル/説明**: 可能なページでは `next-intl` の翻訳キーを使い、言語切替時も適切なタイトル/description になるようにする。

## 具体的なタスク
- [x] 現状調査: `/src/app/(site)` 配下の全ページで `metadata` 未定義箇所を洗い出し、ページごとの期待タイトル/説明を整理する（landing, signin/signup/forgot/reset/verify/resend/pending、dashboard、settings、admin dashboard/users 一覧/詳細/作成/編集 等）。
- [x] サービス名設定の仕様決定: `src/constants/site.ts`（新規）に `SERVICE_NAME` などを定義し、`process.env.NEXT_PUBLIC_SERVICE_NAME ?? "TaskMaster"` のように環境変数優先＋既定値で返す方針を確定する。必要なら `DEFAULT_DESCRIPTION` もここで管理。
- [x] 共通ヘルパー作成: `src/libraries/metadata.ts`（新規）に `buildTitle(pageTitle: string)` と `createMetadata({ title, description, ... })` を実装し、Next.js の `Metadata` 型に準拠させる。サービス名連結・既定 description の適用ロジックを集約する。
- [x] ルートレイアウト更新: `src/app/layout.tsx` の `metadata` をヘルパー＆サービス名定数経由に置き換え、description も `DEFAULT_DESCRIPTION` を採用する。
- [x] 認証前ページの metadata 追加: `/src/app/(site)/(unauthorized)/page.tsx`（ランディング）、`(auth)/signin`, `signup`, `forgot-password`, `reset-password`, `verify-email`, `verify-email/resend`, `verify-email/pending` それぞれにタイトル/説明を設定（必要に応じて翻訳キーを追加）。
- [x] 認証済みアプリ領域の metadata 追加: `(authorized)/(app)/dashboard/page.tsx` と `settings/page.tsx` にページ固有タイトル/説明を付与し、`(authorized)/(app)/layout.tsx` やサイドバータイトルでもサービス名定数を使用する。
- [x] 管理画面の metadata 追加: `(authorized)/admin/layout.tsx` のタイトル表示をサービス名と整合させ、`admin/dashboard`, `admin/users` 一覧・詳細・作成・編集各ページで適切なタイトル/説明を設定（必要に応じて翻訳キーを追加）。
- [x] 翻訳ファイル更新: `messages/ja.json` / `messages/en.json` に追加するページタイトル・description のキーを定義し、既存キーの重複を避ける。
- [x] 環境変数テンプレート整備: `.env.sample` に `NEXT_PUBLIC_SERVICE_NAME`（および description を環境変数で扱う場合はそのキー）を追記し、README などの開発手順への反映要否を確認。
- [ ] 動作確認: `npm run lint` / `npm run test`（存在する場合）を実行し、ローカルで主要ページにアクセスして `<title>` と `<meta name="description">` が期待通りかブラウザ開発者ツールで確認する手順を書き残す。

※ `npm run lint` は `Invalid project directory provided, no such directory: .../lint` と表示され失敗。ディレクトリ解決が誤っている可能性があるため、原因調査と再実行が必要。
