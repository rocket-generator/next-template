---
name: admin-page-scaffolding
description: Use when creating pages under src/app/(site)/(authorized)/admin/. Covers list/detail/edit/create page patterns with DataTable/DataView/DataForm, repositories under src/repositories/, request schemas under src/requests/admin/, and AdminPageHeader breadcrumbs.
---

# Admin Page Scaffolding

## Overview

`/admin/` 配下の管理画面は `AdminPageHeader` + `DataTable` / `DataView` / `DataForm` の組み合わせで作る。参照実装は `src/app/(site)/(authorized)/admin/users`。正本は `docs/guides/admin-pages.md`。

## When to Use

- `src/app/(site)/(authorized)/admin/[entity]/` 配下にページを追加する
- 管理画面の一覧・詳細・作成・編集を実装する
- 管理画面向け Repository / Request schema を追加する

**When NOT to use**: 管理画面 **以外** のページは `creating-pages-components`。

## Must-Follow Rules

1. **権限チェックは `admin/layout.tsx` の `requireAdminSession()` で一括**。各ページで重複実装しない
2. **一覧ページは `offset` / `limit` / `order` / `direction` / `query` の共通クエリ名**を使う
3. **Repository は `src/repositories/[entity]_repository.ts` 直下**。`src/repositories/admin/` は使わない（現行構成）
4. **Request schema は `src/requests/admin/` 配下**: `[entity]_create_request.ts` / `[entity]_update_request.ts`
5. **表示 UI は独自実装を増やさない**: `AdminPageHeader` / `DataTable` / `DataView` / `DataForm` の組み合わせで済ます
6. **全文字列は `next-intl` から取得**
7. **Server Actions は `"use server";` 付きで、request schema で入力検証してから repository / service を経由**

## URL 命名

| 種別 | URL |
|------|-----|
| 一覧 | `/admin/[entities]` |
| 詳細 | `/admin/[entities]/[id]` |
| 新規 | `/admin/[entities]/create` |
| 編集 | `/admin/[entities]/[id]/edit` |

## 主要コンポーネント

- `src/components/molecules/AdminPageHeader` — `breadcrumbLinks` / `title` / `buttons`
- `src/components/organisms/DataTable` — `basePath` / `count` / `offset` / `limit` / `order` / `direction` / `query` / `data` / `structure`
- `src/components/organisms/DataView` — `data` / `structure`（description list 風）
- `src/components/organisms/DataForm` — `structure` / `submitAction`（`Promise<boolean>` を返す async）

`DataForm` の type: `text` / `password` / `select_single` / `checkbox_multi` / `datetime`

## Key Files

- `src/app/(site)/(authorized)/admin/users/` — 参照実装
- `src/app/(site)/(authorized)/admin/layout.tsx` — 権限チェック
- `src/components/molecules/AdminPageHeader/` / `src/components/organisms/{DataTable,DataView,DataForm}/`
- `src/repositories/user_repository.ts` — Repository 実装例
- `src/requests/admin/` — Request schema 配置先
- `messages/ja.json` / `messages/en.json` — `Menu.Admin` / エンティティ名追加

## Reference

- **正本**: `docs/guides/admin-pages.md`（一覧・詳細・作成/編集のコード例あり）
- データアクセス規約: `data-access-repository` Skill
- 翻訳: `i18n-messages` Skill

## Checklist

- [ ] `src/app/(site)/(authorized)/admin/[entity]/` に一覧/詳細/create/edit を配置
- [ ] `src/repositories/[entity]_repository.ts` を追加・更新
- [ ] `src/requests/admin/[entity]_create_request.ts` / `_update_request.ts` を追加
- [ ] `messages/ja.json` / `messages/en.json` に `Menu.Admin` とエンティティ翻訳を追加
- [ ] 一覧が `DataTable` のクエリ契約 (`offset`, `limit`, `order`, `direction`, `query`) に従う
- [ ] 詳細が `DataView` を使う
- [ ] create / edit が `DataForm` と `submitAction` を使う
- [ ] `admin/layout.tsx` のメニューに導線を追加
- [ ] 各 Server Action で request schema による入力検証
- [ ] E2E テストを追加
