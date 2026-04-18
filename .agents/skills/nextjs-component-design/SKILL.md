---
name: nextjs-component-design
description: Use when adding or modifying pages under src/app, or components under src/components (atoms/molecules/organisms) in this Next.js App Router project. Covers Server/Client Component boundary, Atomic Design placement, Server Actions in actions.ts, URL-based state management, sidebar active-state, and shadcn-only atoms rule.
---

# Next.js Component Design

Read [`docs/guides/components.md`](../../../docs/guides/components.md) first — it is the authoritative source.

## Overview

Next.js App Router + Atomic Design でページとコンポーネントを作るガイド。**Server Components First**、インタラクティブ部分のみ最小限の Client Component。

## When to Use

- `src/app/` 配下にページを追加・改修する（`page.tsx` / `actions.ts`）
- `src/components/` 配下にコンポーネントを追加・改修する
- Server Component と Client Component の分割を決める
- サイドメニューのアクティブ判定を実装・修正する

**When NOT to use**: `/admin/` 配下のページは `admin-page-scaffolding`（DataTable / DataView / DataForm パターン）。認証関連は `auth-implementation`。

## Must-Follow Rules

1. **`src/components/atoms` は shadcn/ui のみ**。カスタム要素を置かない。`src/components/ui` は使わない
2. **全 `page.tsx` は Server Component**。インタラクティブ部分のみ小さな Client Component に切り出す
3. **DB アクセス等は Server Actions**。API Route を新規作成しない（`src/app/api` は Auth 用途のみ）
4. **Server Actions は同階層の `actions.ts`** に `"use server";` を付けて配置
5. **ページ全体に影響する状態は URL クエリパラメータ**で管理（`useRouter` + `page.tsx` の再実行）
6. **molecules / organisms は `PascalCase/index.tsx` 形式**（Storybook 共存のため）
7. **`any` 禁止 / `React.FC` 不使用 / コンポーネントは `const` 宣言**
8. **コンポーネントにビジネスロジックを持たせない**。アクションやデータは Props で注入

## ディレクトリ

```
src/app/
└── (site)/(authorized)/(app)/
    ├── page.tsx
    └── actions.ts

src/components/
├── atoms/        # shadcn/ui のみ
├── molecules/PetFilter/index.tsx
└── organisms/AppHeader/index.tsx
```

- **atoms**: shadcn/ui 提供の最小要素。カスタム要素は置かない。拡張する場合は `molecules` 以上でラップ
- **molecules**: 複数の atom を組み合わせた具体的 UI 部品
- **organisms**: ページセクション・独立 UI 領域

## Server / Client の分離方針

- **NG**: ページ全体を大きな Client Component でラップ
- **OK**: `page.tsx` は静的レイアウト + データ取得 (Server)。個々のインタラクティブ UI（`PetFilter`, `MonthNavigator`）だけを独立 Client に切り出す
- Server → Client へ関数（イベントハンドラ）は渡せない。Server Action を渡すか、Client 内で完結させる

## サイドメニューアクティブ判定

- `src/components/organisms/AppSidebar/index.tsx` / `AdminSidebar/index.tsx`
- `usePathname()` で現在パス取得、`href` と前方一致で active 判定
- `src/components/atoms/sidebar.tsx` の `SidebarMenuButton` に `data-[active=true]:font-semibold`

```ts
const normalizePath = (path: string) => {
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "");
};
const isActivePath = (pathname: string, href: string) => {
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
};
```

## 型定義

- プロジェクト共通型は `src/types/` 配下へ用途別に配置（例: `src/types/auth.d.ts`）
- コンポーネント固有型（Props 等）は `index.tsx` 内に記述

## Key Files

- `src/app/` — ページツリー
- `src/components/{atoms,molecules,organisms}/` — UI コンポーネント
- `src/components/organisms/AppSidebar/index.tsx` / `AdminSidebar/index.tsx` — サイドメニュー
- `src/components/atoms/sidebar.tsx` — アクティブスタイル
- `src/types/` — プロジェクト共通型

## Reference

- **正本**: `docs/guides/components.md`
- `AGENTS.md §コンポーネント設計`
- 関連 skill: `admin-page-scaffolding`, `writing-tests`, `writing-storybook`, `i18n-messages`, `data-access-repository`

## Checklist

- [ ] `page.tsx` が Server Component
- [ ] Client Component は最小範囲に切り出している
- [ ] DB アクセスは `actions.ts` の Server Action 経由
- [ ] `src/components/atoms` にカスタム要素が混入していない
- [ ] molecules / organisms が `PascalCase/index.tsx` 形式
- [ ] 文字列はすべて next-intl 経由
- [ ] 対応する Storybook と Unit/Component Test を作成した
